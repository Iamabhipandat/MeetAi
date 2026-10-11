from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.meeting import MeetingStatus


# ─── Request Schemas ───────────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


# ─── Response Schemas ──────────────────────────────────────────────────────────

class MeetingOut(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    status: MeetingStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
