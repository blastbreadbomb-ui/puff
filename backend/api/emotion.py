"""Emotion and mood report API endpoints."""

from datetime import date, timedelta
from collections import Counter
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.database import get_db
from models.emotion_record import EmotionRecord

router = APIRouter(prefix="/api/emotion", tags=["emotion"])


@router.get("/trend")
def get_emotion_trend(days: int = Query(30, ge=1, le=365), db: Session = Depends(get_db)):
    """Get emotion records for trend chart."""
    start_date = date.today() - timedelta(days=days)

    records = (
        db.query(EmotionRecord)
        .filter(EmotionRecord.date >= start_date)
        .order_by(EmotionRecord.date.asc(), EmotionRecord.hour.asc())
        .all()
    )

    return [r.to_dict() for r in records]


@router.get("/report")
def get_emotion_report(days: int = Query(7, ge=1, le=90), db: Session = Depends(get_db)):
    """Generate an emotion/mood report for the specified period."""
    start_date = date.today() - timedelta(days=days)
    end_date = date.today()

    records = (
        db.query(EmotionRecord)
        .filter(EmotionRecord.date >= start_date)
        .all()
    )

    if not records:
        return {
            "period": f"{days}天",
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dominantEmotion": "暂无",
            "emotionDistribution": {},
            "dailyScores": [],
            "summary": "还没有足够的情绪数据呢，多和晓语聊聊天吧~",
            "suggestion": "每天花10分钟记录自己的情绪，能帮助你更好地觉察自己哦。",
        }

    # Calculate daily scores (average per day)
    daily_data = {}
    for r in records:
        day_key = r.date.isoformat()
        if day_key not in daily_data:
            daily_data[day_key] = {"scores": [], "emotions": []}
        daily_data[day_key]["scores"].append(r.score)
        daily_data[day_key]["emotions"].append(r.dominant_emotion)

    daily_scores = []
    for day_key, data in sorted(daily_data.items()):
        avg_score = sum(data["scores"]) / len(data["scores"])
        # Find dominant emotion for the day
        emotion_counter = Counter(data["emotions"])
        dominant = emotion_counter.most_common(1)[0][0] if emotion_counter else "未知"

        daily_scores.append({
            "date": day_key,
            "score": round(avg_score, 2),
            "dominantEmotion": dominant,
        })

    # Emotion distribution
    emotion_dist = Counter()
    for r in records:
        emotion_dist[r.dominant_emotion] += 1
    emotion_distribution = dict(emotion_dist.most_common())

    # Overall dominant emotion
    dominant_emotion = emotion_dist.most_common(1)[0][0] if emotion_dist else "未知"

    # Average score
    all_scores = [r.score for r in records]
    avg_score = sum(all_scores) / len(all_scores) if all_scores else 0

    # Generate summary and suggestion based on data
    summary, suggestion = _generate_insights(
        dominant_emotion, avg_score, emotion_distribution, days
    )

    return {
        "period": f"{days}天",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "dominantEmotion": dominant_emotion,
        "emotionDistribution": emotion_distribution,
        "dailyScores": daily_scores,
        "summary": summary,
        "suggestion": suggestion,
        "averageScore": round(avg_score, 2),
        "totalRecords": len(records),
    }


def _generate_insights(
    dominant_emotion: str,
    avg_score: float,
    distribution: dict,
    days: int,
) -> tuple:
    """Generate human-readable insights from emotion data."""
    summary = ""
    suggestion = ""

    if avg_score >= 0.3:
        summary = f"这{days}天你的情绪整体偏积极，以{dominant_emotion}为主。能看到你的状态还不错呢~"
        suggestion = "继续保持现在的生活节奏，把让你开心的事情记录下来，它们是你应对低谷的秘籍哦。"
    elif avg_score >= -0.3:
        summary = f"这{days}天你的情绪有起有落，以{dominant_emotion}为主。人生本来就是这样呀，有晴有雨~"
        suggestion = "可以试着每天睡前写下三件感恩的小事，慢慢你会发现生活中其实有很多美好的瞬间。"
    else:
        summary = f"这{days}天你似乎经历了一些不太容易的日子，{dominant_emotion}的感受比较多。辛苦了呀。"
        suggestion = "这段时间多给自己一些温柔和空间。如果觉得一个人扛着太累，可以考虑找信任的朋友聊聊，或者找专业的心理咨询师。你值得被好好照顾。"

    return summary, suggestion
