import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class QuestionStatus(str, enum.Enum):
    UNANSWERED = "UNANSWERED"
    ANSWERED = "ANSWERED"
    DUPLICATE = "DUPLICATE"
    IGNORED = "IGNORED"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False, index=True)
    transcript_id = Column(Integer, ForeignKey("transcripts.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    speaker = Column(String(100), nullable=False)
    status = Column(Enum(QuestionStatus), default=QuestionStatus.UNANSWERED, nullable=False)

    # Duplicate detection fields
    is_duplicate = Column(Boolean, default=False, nullable=False)
    duplicate_of = Column(Integer, ForeignKey("questions.id"), nullable=True)
    similarity_score = Column(Float, nullable=True)

    # Embedding stored as JSON (list of floats) for cosine similarity lookups
    embedding = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="questions")
    transcript = relationship("Transcript", back_populates="questions")
    ai_responses = relationship("AIResponse", back_populates="question", cascade="all, delete-orphan")
