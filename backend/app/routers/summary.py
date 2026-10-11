"""Meeting summary router."""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.meeting_summary import MeetingSummary
from app.schemas.meeting_summary import MeetingSummaryOut
from app.services.summary_service import generate_meeting_summary

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/summaries", tags=["Meeting Summaries"])


@router.get("/meeting/{meeting_id}", response_model=MeetingSummaryOut)
def get_or_generate_summary(
    meeting_id: int,
    regenerate: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get the meeting summary. If none exists (or regenerate=True), generate one.
    """
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Check for existing summary
    if not regenerate:
        existing = (
            db.query(MeetingSummary)
            .filter(MeetingSummary.meeting_id == meeting_id)
            .order_by(MeetingSummary.generated_at.desc())
            .first()
        )
        if existing:
            return existing

    # Generate new summary
    summary_text = generate_meeting_summary(meeting_id, db)

    summary = MeetingSummary(
        meeting_id=meeting_id,
        summary_text=summary_text,
        generated_at=datetime.utcnow(),
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    logger.info("Summary generated for meeting %s", meeting_id)
    return summary
