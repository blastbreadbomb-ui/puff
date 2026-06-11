"""Chat API endpoints."""

import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from models.database import get_db
from models.conversation import Conversation, Message
from core.conversation import orchestrator
from schemas.chat import ChatRequest, UpdateTitleRequest

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/send")
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a message and receive a streaming response via SSE."""
    async def event_stream():
        async for event in orchestrator.process_message(
            db=db,
            conversation_id=request.conversation_id,
            user_message=request.message,
            use_memory=request.use_memory,
        ):
            event_type = event["event"]
            data = json.dumps(event["data"], ensure_ascii=False)
            yield f"event: {event_type}\ndata: {data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db)):
    """Get all conversations ordered by most recent."""
    conversations = (
        db.query(Conversation)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [c.to_dict() for c in conversations]


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get a conversation with all its messages."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [m.to_dict() for m in conversation.messages]

    return {
        "conversation": conversation.to_dict(),
        "messages": messages,
    }


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation and all its messages."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted"}


@router.put("/conversations/{conversation_id}/title")
def update_conversation_title(
    conversation_id: str,
    request: UpdateTitleRequest,
    db: Session = Depends(get_db),
):
    """Update a conversation's title."""
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.title = request.title
    db.commit()
    return conversation.to_dict()
