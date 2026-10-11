from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting, MeetingStatus
from app.schemas.meeting import MeetingCreate, MeetingUpdate, MeetingOut

router = APIRouter(prefix="/meetings", tags=["Meetings"])


def get_meeting_or_404(meeting_id: int, user: User, db: Session) -> Meeting:
    """Helper: fetch meeting by id, ensure it belongs to the current user."""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


# ─── Create ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=MeetingOut, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = Meeting(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ─── List ─────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[MeetingOut])
def list_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all meetings owned by the current user, newest first."""
    return (
        db.query(Meeting)
        .filter(Meeting.user_id == current_user.id)
        .order_by(Meeting.created_at.desc())
        .all()
    )


# ─── Get Single ───────────────────────────────────────────────────────────────

@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_meeting_or_404(meeting_id, current_user, db)


# ─── Update ───────────────────────────────────────────────────────────────────

@router.patch("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: int,
    payload: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = get_meeting_or_404(meeting_id, current_user, db)
    if meeting.status == MeetingStatus.ENDED:
        raise HTTPException(status_code=400, detail="Cannot update an ended meeting")

    if payload.title is not None:
        meeting.title = payload.title
    if payload.description is not None:
        meeting.description = payload.description

    db.commit()
    db.refresh(meeting)
    return meeting


# ─── Start ────────────────────────────────────────────────────────────────────

@router.post("/{meeting_id}/start", response_model=MeetingOut)
def start_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = get_meeting_or_404(meeting_id, current_user, db)
    if meeting.status == MeetingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Meeting is already active")
    if meeting.status == MeetingStatus.ENDED:
        raise HTTPException(status_code=400, detail="Cannot restart an ended meeting")

    meeting.status = MeetingStatus.ACTIVE
    meeting.started_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return meeting


# ─── Finish ───────────────────────────────────────────────────────────────────

@router.post("/{meeting_id}/finish", response_model=MeetingOut)
def finish_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = get_meeting_or_404(meeting_id, current_user, db)
    if meeting.status != MeetingStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Meeting must be ACTIVE to finish")

    meeting.status = MeetingStatus.ENDED
    meeting.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return meeting


# ─── Delete ───────────────────────────────────────────────────────────────────

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    meeting = get_meeting_or_404(meeting_id, current_user, db)
    db.delete(meeting)
    db.commit()
