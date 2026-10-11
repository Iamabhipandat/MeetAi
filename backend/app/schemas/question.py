from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.question import QuestionStatus


# ─── Response Schemas ──────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: int
    meeting_id: int
    transcript_id: int
    question_text: str
    speaker: str
    status: QuestionStatus
    is_duplicate: bool
    duplicate_of: Optional[int]
    similarity_score: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionStatusUpdate(BaseModel):
    status: QuestionStatus
