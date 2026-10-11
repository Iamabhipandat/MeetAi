from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.question import Question
from app.schemas.question import QuestionOut, QuestionStatusUpdate

router = APIRouter(prefix="/questions", tags=["Questions"])


def verify_meeting_ownership(meeting_id: int, user: User, db: Session) -> Meeting:
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# ─── List Questions for a Meeting ────────────────────────────────────────────

@router.get("/meeting/{meeting_id}", response_model=List[QuestionOut])
def list_questions(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all questions detected in a meeting, newest first."""
    verify_meeting_ownership(meeting_id, current_user, db)
    return (
        db.query(Question)
        .filter(Question.meeting_id == meeting_id)
        .order_by(Question.created_at.asc())
        .all()
    )


# ─── Get Single Question ──────────────────────────────────────────────────────

@router.get("/{question_id}", response_model=QuestionOut)
def get_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    verify_meeting_ownership(question.meeting_id, current_user, db)
    return question


# ─── Update Question Status ───────────────────────────────────────────────────

@router.patch("/{question_id}/status", response_model=QuestionOut)
def update_question_status(
    question_id: int,
    payload: QuestionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Manually mark a question as ANSWERED, IGNORED, etc."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    verify_meeting_ownership(question.meeting_id, current_user, db)

    question.status = payload.status
    db.commit()
    db.refresh(question)
    return question
