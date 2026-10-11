"""AI response router — generates contextual answers to meeting questions."""

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.question import Question, QuestionStatus
from app.models.ai_response import AIResponse
from app.schemas.ai_response import AIResponseOut
from app.services.ai_response_service import generate_ai_response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI Responses"])


@router.post("/questions/{question_id}/answer", response_model=AIResponseOut, status_code=status.HTTP_201_CREATED)
def generate_answer(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate an AI answer for a specific question using meeting transcript context."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Verify ownership
    meeting = db.query(Meeting).filter(
        Meeting.id == question.meeting_id,
        Meeting.user_id == current_user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Generate AI response
    response_text = generate_ai_response(
        question_text=question.question_text,
        meeting_id=question.meeting_id,
        db=db,
    )

    # Save to DB
    ai_response = AIResponse(
        question_id=question.id,
        response_text=response_text,
    )
    db.add(ai_response)

    # Update question status
    question.status = QuestionStatus.ANSWERED
    db.commit()
    db.refresh(ai_response)

    logger.info("AI response generated for question %s in meeting %s", question_id, meeting.id)
    return ai_response


@router.get("/questions/{question_id}/responses", response_model=List[AIResponseOut])
def list_responses(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all AI responses for a specific question."""
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    meeting = db.query(Meeting).filter(
        Meeting.id == question.meeting_id,
        Meeting.user_id == current_user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return (
        db.query(AIResponse)
        .filter(AIResponse.question_id == question_id)
        .order_by(AIResponse.created_at.desc())
        .all()
    )
