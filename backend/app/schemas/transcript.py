from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ─── Request Schemas ───────────────────────────────────────────────────────────

class TranscriptCreate(BaseModel):
    meeting_id: int
    speaker: str
    content: str
    timestamp: Optional[datetime] = None   # defaults to server time if omitted


# ─── Response Schemas ──────────────────────────────────────────────────────────

class TranscriptOut(BaseModel):
    id: int
    meeting_id: int
    speaker: str
    content: str
    timestamp: datetime
    sequence_number: int

    model_config = {"from_attributes": True}
