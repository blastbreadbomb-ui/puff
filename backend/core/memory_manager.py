"""
Memory manager for long-term user knowledge.

Manages user memories across categories:
- name: user's name/nickname preferences
- preference: likes, dislikes, preferences
- experience: important life events
- sensitive_topic: topics to avoid or handle carefully
- milestone: emotional growth milestones
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models.user_memory import UserMemory


class MemoryManager:
    """Manages long-term user memories."""

    # Memory categories
    CATEGORY_NAME = "name"
    CATEGORY_PREFERENCE = "preference"
    CATEGORY_EXPERIENCE = "experience"
    CATEGORY_SENSITIVE = "sensitive_topic"
    CATEGORY_MILESTONE = "milestone"

    def get_all(self, db: Session) -> List[Dict[str, Any]]:
        """Get all memories ordered by importance."""
        memories = db.query(UserMemory).order_by(
            UserMemory.importance.desc()
        ).all()
        return [m.to_dict() for m in memories]

    def get_by_category(self, db: Session, category: str) -> List[Dict[str, Any]]:
        """Get memories in a specific category."""
        memories = db.query(UserMemory).filter(
            UserMemory.category == category
        ).all()
        return [m.to_dict() for m in memories]

    def get_context_string(self, db: Session) -> str:
        """Build a context string for inclusion in the system prompt."""
        memories = db.query(UserMemory).order_by(
            UserMemory.importance.desc()
        ).limit(20).all()

        if not memories:
            return ""

        lines = ["\n## 关于用户的信息（请自然地在对话中使用，不要刻意提及）："]
        for m in memories:
            if m.category == self.CATEGORY_NAME:
                lines.append(f"- 用户的名字/称呼：{m.value}")
            elif m.category == self.CATEGORY_PREFERENCE:
                lines.append(f"- 用户喜欢/偏好：{m.key} — {m.value}")
            elif m.category == self.CATEGORY_EXPERIENCE:
                lines.append(f"- 用户的经历：{m.key} — {m.value}")
            elif m.category == self.CATEGORY_SENSITIVE:
                lines.append(f"- ⚠️ 敏感话题（避免直接提及，谨慎讨论）：{m.key}")
            elif m.category == self.CATEGORY_MILESTONE:
                lines.append(f"- 🌟 成长里程碑：{m.key} — {m.value}")

        return "\n".join(lines)

    def add_or_update(
        self,
        db: Session,
        category: str,
        key: str,
        value: str,
        importance: int = 1,
        source_msg_id: Optional[str] = None,
    ) -> UserMemory:
        """Add a new memory or update existing one."""
        existing = db.query(UserMemory).filter(
            UserMemory.category == category,
            UserMemory.key == key,
        ).first()

        if existing:
            existing.value = value
            if importance > existing.importance:
                existing.importance = importance
            existing.source_msg_id = source_msg_id
            db.commit()
            db.refresh(existing)
            return existing
        else:
            memory = UserMemory(
                category=category,
                key=key,
                value=value,
                importance=importance,
                source_msg_id=source_msg_id,
            )
            db.add(memory)
            db.commit()
            db.refresh(memory)
            return memory

    def delete(self, db: Session, memory_id: str) -> bool:
        """Delete a memory by ID."""
        memory = db.query(UserMemory).filter(UserMemory.id == memory_id).first()
        if memory:
            db.delete(memory)
            db.commit()
            return True
        return False

    def extract_and_save_memories(
        self,
        db: Session,
        user_message: str,
        assistant_response: str,
        msg_id: str,
    ) -> List[UserMemory]:
        """Analyze conversation and extract new memories.

        This is a simplified version — in production you would use
        an LLM call to extract structured memory updates.
        For MVP, we rely on explicit user sharing.
        """
        # For MVP, we detect basic patterns:
        new_memories = []

        # Detect name sharing
        name_patterns = [
            "我叫", "我是", "我的名字是", "叫我", "你可以叫我",
        ]
        for pattern in name_patterns:
            if pattern in user_message:
                idx = user_message.find(pattern) + len(pattern)
                # Extract the next few characters as potential name
                name_part = user_message[idx:idx + 20].strip()
                # Clean up
                for delimiter in ["，", "。", " ", "、", "！", "？", "\n"]:
                    if delimiter in name_part:
                        name_part = name_part.split(delimiter)[0]
                if name_part and len(name_part) <= 10:
                    mem = self.add_or_update(
                        db, self.CATEGORY_NAME, "user_name",
                        name_part, importance=5, source_msg_id=msg_id,
                    )
                    new_memories.append(mem)

        return new_memories


memory_manager = MemoryManager()
