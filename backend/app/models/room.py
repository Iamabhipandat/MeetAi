from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.core.database import Base


class Room(Base):
    """LiveKit room tied to a Meeting."""
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False, unique=True)
    livekit_room_name = Column(String(255), unique=True, nullable=False)
    join_code = Column(String(12), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=func.now())
