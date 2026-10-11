from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.models.meeting import Meeting
from app.models.room import Room
from app.services.livekit_service import generate_room_name, generate_join_code, generate_participant_token

router = APIRouter(prefix="/rooms", tags=["Rooms"])


@router.post("/{meeting_id}/create")
def create_room(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a LiveKit room for a meeting. Only the meeting owner can do this."""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.user_id == current_user.id
    ).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Idempotent: return existing room if already created
    existing = db.query(Room).filter(Room.meeting_id == meeting_id).first()
    if existing:
        return {
            "room_name": existing.livekit_room_name,
            "join_code": existing.join_code,
            "join_url": f"/join/{existing.join_code}",
        }

    room_name = generate_room_name(meeting_id)
    join_code = generate_join_code()

    room = Room(
        meeting_id=meeting_id,
        livekit_room_name=room_name,
        join_code=join_code,
    )
    db.add(room)
    db.commit()
    db.refresh(room)

    return {
        "room_name": room.livekit_room_name,
        "join_code": room.join_code,
        "join_url": f"/join/{room.join_code}",
    }


@router.get("/join/{join_code}")
def get_room_by_code(join_code: str, db: Session = Depends(get_db)):
    """Get room info by join code (public — for guests joining)."""
    room = db.query(Room).filter(Room.join_code == join_code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Invalid join code")
    meeting = db.query(Meeting).filter(Meeting.id == room.meeting_id).first()
    return {
        "room_name": room.livekit_room_name,
        "join_code": room.join_code,
        "meeting_id": room.meeting_id,
        "meeting_title": meeting.title if meeting else "Meeting",
        "meeting_status": meeting.status if meeting else "UNKNOWN",
    }


@router.post("/{meeting_id}/token")
def get_participant_token(
    meeting_id: int,
    participant_name: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Generate a LiveKit JWT for the current user to join the room."""
    room = db.query(Room).filter(Room.meeting_id == meeting_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not created yet. Start the meeting first.")

    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    is_host = meeting and meeting.user_id == current_user.id

    token = generate_participant_token(
        room_name=room.livekit_room_name,
        participant_name=participant_name or current_user.name,
        is_host=is_host,
    )
    return {
        "token": token,
        "room_name": room.livekit_room_name,
        "livekit_url": "ws://localhost:7880",
        "is_host": is_host,
    }


@router.post("/join/{join_code}/token")
def get_guest_token(
    join_code: str,
    participant_name: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
):
    """Generate a LiveKit JWT for a guest (no account needed)."""
    room = db.query(Room).filter(Room.join_code == join_code).first()
    if not room:
        raise HTTPException(status_code=404, detail="Invalid join code")

    token = generate_participant_token(
        room_name=room.livekit_room_name,
        participant_name=participant_name,
        is_host=False,
    )
    return {
        "token": token,
        "room_name": room.livekit_room_name,
        "livekit_url": "ws://localhost:7880",
        "meeting_id": room.meeting_id,
    }
