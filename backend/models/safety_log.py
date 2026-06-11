"""SafetyLog ORM model for risk detection audit trail."""

from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text
from .database import Base, generate_uuid


class SafetyLog(Base):
    __tablename__ = "safety_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    msg_id = Column(String)
    risk_level = Column(String(20), nullable=False)
    trigger_keywords = Column(Text)
    action_taken = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "msgId": self.msg_id,
            "riskLevel": self.risk_level,
            "triggerKeywords": self.trigger_keywords,
            "actionTaken": self.action_taken,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
