from datetime import datetime
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.core.database import Base


class AIResponse(Base):
    __tablename__ = "ai_responses"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)
    response_text = Column(Text, nullable=False)
    confidence_score = Column(Float, nullable=True)
    context_used = Column(Text, nullable=True)  # transcript context fed to the LLM
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    question = relationship("Question", back_populates="ai_responses")
