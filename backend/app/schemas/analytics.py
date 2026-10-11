from typing import List
from pydantic import BaseModel


class MeetingAnalytics(BaseModel):
    meeting_id: int
    title: str
    total_transcripts: int
    total_questions: int
    answered_questions: int
    unanswered_questions: int
    duplicate_questions: int
    has_summary: bool


class OverallAnalytics(BaseModel):
    total_meetings: int
    total_transcripts: int
    total_questions: int
    answered_questions: int
    unanswered_questions: int
    duplicate_questions: int
    meetings: List[MeetingAnalytics]
