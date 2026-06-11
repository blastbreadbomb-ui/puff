"""
Conversation orchestrator — coordinates the full chat pipeline:

1. Risk detection (keyword + semantic)
2. Emotion analysis
3. Memory retrieval
4. LLM chat with persona
5. Post-processing (save, update records)
"""

import json
from datetime import datetime, date
from typing import AsyncGenerator, Dict, Any, Optional
from sqlalchemy.orm import Session

from models.conversation import Conversation, Message
from models.emotion_record import EmotionRecord
from models.safety_log import SafetyLog
from models.database import generate_uuid

from core.persona import SYSTEM_PROMPT
from core.emotion_analyzer import emotion_analyzer
from core.risk_detector import risk_detector
from core.memory_manager import memory_manager
from services.llm_service import llm_service
from config import settings


class ConversationOrchestrator:
    """Orchestrates the full conversational flow."""

    async def process_message(
        self,
        db: Session,
        conversation_id: Optional[str],
        user_message: str,
        use_memory: bool = True,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process a user message and yield SSE events.

        Yields events: emotion, risk, chunk, done
        """
        # ===== Step 0: Create or get conversation =====
        conversation = None
        if conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == conversation_id
            ).first()

        if not conversation:
            conversation = Conversation(
                id=generate_uuid(),
                title=user_message[:30] if len(user_message) > 30 else user_message,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
            conversation_id = conversation.id

        # Save user message
        user_msg = Message(
            id=generate_uuid(),
            conversation_id=conversation_id,
            role="user",
            content=user_message,
        )

        # ===== Step 1: Risk Detection =====
        risk_result = await risk_detector.assess(user_message)

        # Update user message with risk info
        user_msg.risk_level = risk_result["level"]
        db.add(user_msg)
        db.commit()

        # Yield risk event
        yield {
            "event": "risk",
            "data": {
                "level": risk_result["level"],
                "action": risk_result["action"],
                "message": risk_result.get("message"),
            },
        }

        # If high risk, save safety log and send intervention
        if risk_result["level"] == "high" and risk_result["action"] == "intervene":
            safety_log = SafetyLog(
                id=generate_uuid(),
                msg_id=user_msg.id,
                risk_level="high",
                trigger_keywords=", ".join(risk_result.get("trigger_keywords", [])),
                action_taken="intervene",
            )
            db.add(safety_log)
            db.commit()

            # Send intervention message instead of normal chat
            intervention_msg = risk_result["message"]
            assistant_msg = Message(
                id=generate_uuid(),
                conversation_id=conversation_id,
                role="assistant",
                content=intervention_msg,
                risk_level="high",
            )
            db.add(assistant_msg)
            db.commit()

            yield {
                "event": "chunk",
                "data": {"content": intervention_msg},
            }
            yield {
                "event": "done",
                "data": {
                    "conversationId": conversation_id,
                    "messageId": assistant_msg.id,
                    "emotionTag": "警惕",
                    "riskLevel": "high",
                    "fullResponse": intervention_msg,
                },
            }
            return

        # ===== Step 2: Emotion Analysis =====
        emotion_result = await emotion_analyzer.analyze(user_message)

        # Update user message with emotion info
        user_msg.emotion_tag = emotion_result["emotion"]
        user_msg.emotion_intensity = emotion_result["intensity"]
        db.commit()

        # Save emotion record for daily tracking
        today = date.today()
        now = datetime.utcnow()
        emotion_record = EmotionRecord(
            id=generate_uuid(),
            date=today,
            hour=now.hour,
            dominant_emotion=emotion_result["emotion"],
            intensity=emotion_result["intensity"],
            score=emotion_result["score"],
        )
        db.add(emotion_record)

        # Yield emotion event
        yield {
            "event": "emotion",
            "data": {
                "emotion": emotion_result["emotion"],
                "intensity": emotion_result["intensity"],
                "score": emotion_result["score"],
            },
        }

        # ===== Step 3: Build Messages for LLM =====
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add memory context
        if use_memory:
            memory_context = memory_manager.get_context_string(db)
            if memory_context:
                messages[0]["content"] += memory_context

        # Add conversation history
        recent_messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.desc())
            .limit(settings.max_history_messages)
            .all()
        )

        # Reverse to chronological order
        recent_messages = list(reversed(recent_messages))

        for msg in recent_messages:
            if msg.role in ("user", "assistant"):
                messages.append({"role": msg.role, "content": msg.content})

        # If the last message isn't the current user message, add it
        if not recent_messages or recent_messages[-1].id != user_msg.id:
            messages.append({"role": "user", "content": user_message})

        # ===== Step 4: Stream LLM Response =====
        full_response = ""

        try:
            async for chunk in llm_service.chat_stream(messages):
                full_response += chunk
                yield {
                    "event": "chunk",
                    "data": {"content": chunk},
                }
        except Exception as e:
            # If LLM fails, provide a fallback response
            fallback = "抱歉呀，我这边网络好像有点问题呢...你稍等一下，我马上回来~"
            full_response = fallback
            yield {
                "event": "chunk",
                "data": {"content": fallback},
            }

        # ===== Step 5: Save Assistant Message =====
        assistant_msg = Message(
            id=generate_uuid(),
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
            risk_level=risk_result["level"],
        )
        db.add(assistant_msg)
        db.commit()

        # ===== Step 6: Extract & Update Memories =====
        try:
            memory_manager.extract_and_save_memories(
                db, user_message, full_response, user_msg.id
            )
        except Exception:
            pass  # Memory extraction failure shouldn't break chat

        # ===== Step 7: Update Conversation Title =====
        if conversation.title == "新的对话" or (
            conversation.title == user_message[:30]
            and len(conversation.messages) <= 4
        ):
            # Generate a better title from the first exchange
            try:
                title_messages = [
                    {"role": "system", "content": "你是一个助手。请用5-8个字总结用户想聊的话题。只返回总结，不要其他内容。"},
                    {"role": "user", "content": user_message},
                ]
                new_title = await llm_service.chat(title_messages, temperature=0.3, max_tokens=20)
                new_title = new_title.strip().strip("。，！？")
                if new_title and len(new_title) <= 20:
                    conversation.title = new_title
                    db.commit()
            except Exception:
                pass

        # ===== Done =====
        yield {
            "event": "done",
            "data": {
                "conversationId": conversation_id,
                "messageId": assistant_msg.id,
                "emotionTag": emotion_result["emotion"],
                "riskLevel": risk_result["level"],
                "fullResponse": full_response,
            },
        }


orchestrator = ConversationOrchestrator()
