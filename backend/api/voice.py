"""Voice call WebSocket endpoint - real-time voice conversation pipeline."""

import json
import asyncio
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from models.database import get_db, SessionLocal
from core.conversation import orchestrator
from services.tts_service import tts_service

router = APIRouter()

# Sentence boundary markers for natural TTS pauses
SENTENCE_ENDS = {"。", "！", "？", "!", "?", "\n", "~", "…"}


@router.websocket("/api/voice/call")
async def voice_call(websocket: WebSocket):
    """WebSocket endpoint for real-time voice conversations.

    Client sends:
      {"type": "start", "conversation_id": "..." | null}
      {"type": "message", "text": "..."}
      {"type": "interrupt"}

    Server sends:
      {"type": "emotion", "data": {...}}
      {"type": "risk", "data": {...}}
      {"type": "text", "data": {"content": "..."}}
      {"type": "audio", "data": {"audio": "base64..."}}
      {"type": "done", "data": {...}}
      {"type": "interrupted"}
    """
    await websocket.accept()

    db: Session = SessionLocal()
    conversation_id: Optional[str] = None
    interrupt_event = asyncio.Event()
    current_tts_task: Optional[asyncio.Task] = None

    async def safe_send(msg: dict):
        """Send a JSON message, ignoring errors if disconnected."""
        try:
            await websocket.send_json(msg)
        except Exception:
            pass

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            msg_type = data.get("type", "")

            if msg_type == "start":
                conversation_id = data.get("conversation_id")

            elif msg_type == "message":
                user_text = data.get("text", "").strip()
                if not user_text:
                    continue

                # Reset interrupt flag
                interrupt_event.clear()

                # Run the conversation pipeline
                tts_buffer = ""
                interrupted = False

                async for event in orchestrator.process_message(
                    db=db,
                    conversation_id=conversation_id,
                    user_message=user_text,
                    use_memory=True,
                ):
                    # Check for interrupt
                    if interrupt_event.is_set():
                        interrupted = True
                        break

                    event_type = event["event"]

                    if event_type == "emotion":
                        await safe_send({"type": "emotion", "data": event["data"]})

                    elif event_type == "risk":
                        await safe_send({"type": "risk", "data": event["data"]})
                        # High risk intervention
                        if event["data"].get("action") == "intervene":
                            intervention_text = event["data"].get("message", "")
                            if intervention_text:
                                await safe_send({
                                    "type": "text",
                                    "data": {"content": intervention_text},
                                })
                                # Generate TTS for intervention
                                try:
                                    audio_full = await tts_service.generate_full(intervention_text)
                                    if audio_full:
                                        await safe_send({
                                            "type": "audio",
                                            "data": {"audio": audio_full},
                                        })
                                except Exception:
                                    pass

                    elif event_type == "chunk":
                        content = event["data"]["content"]
                        await safe_send({
                            "type": "text",
                            "data": {"content": content},
                        })

                        # Accumulate text for TTS
                        tts_buffer += content

                        # When we hit a sentence boundary, generate TTS
                        if content and content[-1] in SENTENCE_ENDS:
                            tts_text = tts_buffer.strip()
                            tts_buffer = ""

                            if tts_text and not interrupt_event.is_set():
                                async for audio_b64 in tts_service.stream_audio(tts_text):
                                    if interrupt_event.is_set():
                                        break
                                    await safe_send({
                                        "type": "audio",
                                        "data": {"audio": audio_b64},
                                    })

                    elif event_type == "done":
                        conversation_id = event["data"].get("conversationId")

                        # Flush remaining TTS buffer
                        remaining = tts_buffer.strip()
                        if remaining and not interrupted:
                            try:
                                audio_full = await tts_service.generate_full(remaining)
                                if audio_full:
                                    await safe_send({
                                        "type": "audio",
                                        "data": {"audio": audio_full},
                                    })
                            except Exception:
                                pass

                        await safe_send({"type": "done", "data": event["data"]})

                if interrupted:
                    tts_buffer = ""
                    await safe_send({"type": "interrupted"})

            elif msg_type == "interrupt":
                interrupt_event.set()
                await safe_send({"type": "interrupted"})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[Voice] Error: {e}")
    finally:
        db.close()
