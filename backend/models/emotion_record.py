"""EmotionRecord ORM model for mood tracking."""

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text
from .database import Base, generate_uuid


class EmotionRecord(Base):
    __tablename__ = "emotion_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    date = Column(Date, nullable=False)
    hour = Column(Integer)  # 0-23
    dominant_emotion = Column(String(50), nullable=False)
    intensity = Column(String(20), nullable=False)  # mild | moderate | intense
    summary = Column(Text)
    score = Column(Float, default=0.0)  # -1.0 to 1.0
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date.isoformat() if self.date else None,
            "hour": self.hour,
            "dominantEmotion": self.dominant_emotion,
            "intensity": self.intensity,
            "summary": self.summary,
            "score": self.score,
        }
