"""Analytics router — provides meeting statistics and insights."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.transcript import Transcript
from app.models.question import Question, QuestionStatus
from app.models.meeting_summary import MeetingSummary
from app.schemas.analytics import MeetingAnalytics, OverallAnalytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/", response_model=OverallAnalytics)
def get_overall_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get overall analytics across all meetings for the current user."""
    meetings = db.query(Meeting).filter(Meeting.user_id == current_user.id).all()

    total_transcripts = 0
    total_questions = 0
    total_answered = 0
    total_unanswered = 0
    total_duplicates = 0
    meeting_analytics = []

    for m in meetings:
        t_count = db.query(func.count(Transcript.id)).filter(Transcript.meeting_id == m.id).scalar() or 0
        q_count = db.query(func.count(Question.id)).filter(Question.meeting_id == m.id).scalar() or 0
        answered = db.query(func.count(Question.id)).filter(
            Question.meeting_id == m.id, Question.status == QuestionStatus.ANSWERED
        ).scalar() or 0
        unanswered = db.query(func.count(Question.id)).filter(
            Question.meeting_id == m.id, Question.status == QuestionStatus.UNANSWERED
        ).scalar() or 0
        duplicates = db.query(func.count(Question.id)).filter(
            Question.meeting_id == m.id, Question.status == QuestionStatus.DUPLICATE
        ).scalar() or 0
        has_summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == m.id).first() is not None

        total_transcripts += t_count
        total_questions += q_count
        total_answered += answered
        total_unanswered += unanswered
        total_duplicates += duplicates

        meeting_analytics.append(
            MeetingAnalytics(
                meeting_id=m.id,
                title=m.title,
                total_transcripts=t_count,
                total_questions=q_count,
                answered_questions=answered,
                unanswered_questions=unanswered,
                duplicate_questions=duplicates,
                has_summary=has_summary,
            )
        )

    return OverallAnalytics(
        total_meetings=len(meetings),
        total_transcripts=total_transcripts,
        total_questions=total_questions,
        answered_questions=total_answered,
        unanswered_questions=total_unanswered,
        duplicate_questions=total_duplicates,
        meetings=meeting_analytics,
    )
