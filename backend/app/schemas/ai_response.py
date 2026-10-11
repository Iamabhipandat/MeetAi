from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AIResponseOut(BaseModel):
    id: int
    question_id: int
    response_text: str
    confidence_score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AIResponseRequest(BaseModel):
    """Optional body for manually triggering AI response generation."""
    pass
