"""UserMemory ORM model for long-term user knowledge."""

from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, UniqueConstraint
from .database import Base, generate_uuid


class UserMemory(Base):
    __tablename__ = "user_memories"
    __table_args__ = (
        UniqueConstraint("category", "key", name="uq_category_key"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    category = Column(String(50), nullable=False)  # name | preference | experience | sensitive_topic | milestone
    key = Column(String(100), nullable=False)
    value = Column(Text, nullable=False)
    importance = Column(Integer, default=1)  # 1-5
    source_msg_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "key": self.key,
            "value": self.value,
            "importance": self.importance,
            "sourceMsgId": self.source_msg_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
