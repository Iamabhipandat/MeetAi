from datetime import datetime
from pydantic import BaseModel


class MeetingSummaryOut(BaseModel):
    id: int
    meeting_id: int
    summary_text: str
    generated_at: datetime

    model_config = {"from_attributes": True}
