"""Memory management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from core.memory_manager import memory_manager

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("")
def list_memories(db: Session = Depends(get_db)):
    """Get all user memories."""
    return memory_manager.get_all(db)


@router.delete("/{memory_id}")
def delete_memory(memory_id: str, db: Session = Depends(get_db)):
    """Delete a specific memory."""
    success = memory_manager.delete(db, memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Memory deleted"}
