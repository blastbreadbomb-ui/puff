"""Chat-related Pydantic schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for sending a chat message."""
    conversation_id: Optional[str] = Field(None, description="Conversation ID, null to create new")
    message: str = Field(..., min_length=1, max_length=5000, description="User message")
    use_memory: bool = Field(True, description="Whether to include memory context")


class ChatResponse(BaseModel):
    """Response after chat completion."""
    conversation_id: str
    message_id: str
    emotion_tag: str
    risk_level: str
    full_response: str


class ConversationResponse(BaseModel):
    """Conversation summary."""
    id: str
    title: str
    created_at: str
    updated_at: str
    is_active: bool
    message_count: int
    last_message: Optional[str] = None


class UpdateTitleRequest(BaseModel):
    """Request to update conversation title."""
    title: str = Field(..., min_length=1, max_length=100)
