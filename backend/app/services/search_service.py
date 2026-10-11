"""
search_service.py

Provides text search across meeting transcripts.
Filters by user ownership so users only see their own data.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.transcript import Transcript
from app.models.meeting import Meeting

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    transcript_id: int
    meeting_id: int
    meeting_title: str
    speaker: str
    content: str
    relevance_score: float


def text_search(
    query: str,
    user_id: int,
    db: Session,
    meeting_id: Optional[int] = None,
    limit: int = 20,
) -> List[SearchResult]:
    """
    Simple text search (ILIKE / LIKE) across transcripts.
    Filters by user ownership via Meeting.user_id.
    """
    q = (
        db.query(Transcript, Meeting)
        .join(Meeting, Transcript.meeting_id == Meeting.id)
        .filter(Meeting.user_id == user_id)
    )
    if meeting_id:
        q = q.filter(Transcript.meeting_id == meeting_id)

    # Use LIKE for SQLite compatibility in tests, ILIKE for PostgreSQL
    q = q.filter(Transcript.content.like(f"%{query}%"))
    results = q.order_by(Transcript.id.desc()).limit(limit).all()

    return [
        SearchResult(
            transcript_id=t.id,
            meeting_id=m.id,
            meeting_title=m.title,
            speaker=t.speaker,
            content=t.content,
            relevance_score=1.0,
        )
        for t, m in results
    ]
