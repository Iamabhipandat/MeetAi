"""Transcripts router — ingest transcript entries + trigger AI pipeline."""

import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.meeting import Meeting, MeetingStatus
from app.models.question import Question, QuestionStatus
from app.models.transcript import Transcript
from app.models.user import User
from app.schemas.transcript import TranscriptCreate, TranscriptOut
from app.services.duplicate_detector import check_duplicate
from app.services.question_detector import detect_question

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/transcripts", tags=["Transcripts"])


def verify_active_meeting(meeting_id: int, user: User, db: Session) -> Meeting:
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.status != MeetingStatus.ACTIVE:
        raise HTTPException(
            status_code=400,
            detail=f"Meeting is not active (status: {meeting.status}). Start the meeting first."
        )
    return meeting


# ─── Add Transcript Entry ─────────────────────────────────────────────────────

@router.post("/", response_model=TranscriptOut, status_code=status.HTTP_201_CREATED)
def add_transcript(
    payload: TranscriptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Submit a new transcript entry for an active meeting.

    Pipeline (all steps after commit are fire-and-recover):
      1. Detect whether content contains a question
      2. If yes → check for semantic duplicates using embeddings + cosine similarity
      3. Store question with correct status (UNANSWERED or DUPLICATE)
      4. Always return the transcript — AI failures never block this
    """
    verify_active_meeting(payload.meeting_id, current_user, db)

    # Auto-assign sequence number
    last_seq = db.query(func.max(Transcript.sequence_number)).filter(
        Transcript.meeting_id == payload.meeting_id
    ).scalar()
    next_seq = (last_seq or 0) + 1

    transcript = Transcript(
        meeting_id=payload.meeting_id,
        speaker=payload.speaker,
        content=payload.content,
        timestamp=payload.timestamp or datetime.utcnow(),
        sequence_number=next_seq,
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    # ── AI Pipeline ───────────────────────────────────────────────────────────
    try:
        # Step 1: Question Detection
        detection = detect_question(payload.content)

        if detection.is_question and detection.question_text:
            # Step 2: Duplicate Detection
            dup_result = check_duplicate(
                new_question_text=detection.question_text,
                meeting_id=payload.meeting_id,
                db=db,
            )

            # Step 3: Determine status
            q_status = QuestionStatus.DUPLICATE if dup_result.is_duplicate else QuestionStatus.UNANSWERED

            # Step 4: Save question with embedding + duplicate metadata
            # embedding column is JSON — SQLAlchemy serialises the list automatically
            question = Question(
                meeting_id=payload.meeting_id,
                transcript_id=transcript.id,
                question_text=detection.question_text,
                speaker=payload.speaker,
                status=q_status,
                is_duplicate=dup_result.is_duplicate,
                duplicate_of=dup_result.duplicate_of,
                similarity_score=dup_result.similarity_score,
                embedding=dup_result.embedding,
            )
            db.add(question)
            db.commit()

            logger.info(
                "Question saved | meeting=%s | duplicate=%s | score=%s | text='%s'",
                payload.meeting_id,
                dup_result.is_duplicate,
                dup_result.similarity_score,
                detection.question_text[:60],
            )

    except Exception as exc:
        logger.error("AI pipeline error on transcript %s: %s", transcript.id, exc)

    return transcript


# ─── List Transcripts for a Meeting ──────────────────────────────────────────

@router.get("/meeting/{meeting_id}", response_model=List[TranscriptOut])
def get_meeting_transcripts(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting_id)
        .order_by(Transcript.sequence_number.asc())
        .all()
    )


# ─── Get Single Transcript ────────────────────────────────────────────────────

@router.get("/{transcript_id}", response_model=TranscriptOut)
def get_transcript(
    transcript_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=404, detail="Transcript entry not found")

    meeting = db.query(Meeting).filter(
        Meeting.id == transcript.meeting_id,
        Meeting.user_id == current_user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=403, detail="Access denied")

    return transcript
