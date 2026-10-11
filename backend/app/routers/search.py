"""Search router — provides text search across meeting transcripts."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User
from app.schemas.search import SearchResponse, SearchResultItem
from app.services.search_service import text_search

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/", response_model=SearchResponse)
def search_transcripts(
    q: str = Query(..., min_length=1, description="Search query"),
    meeting_id: Optional[int] = Query(None, description="Filter by meeting ID"),
    limit: int = Query(20, ge=1, le=100, description="Max results"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Search across all meeting transcripts owned by the current user."""
    results = text_search(
        query=q,
        user_id=current_user.id,
        db=db,
        meeting_id=meeting_id,
        limit=limit,
    )

    return SearchResponse(
        query=q,
        total_results=len(results),
        results=[
            SearchResultItem(
                transcript_id=r.transcript_id,
                meeting_id=r.meeting_id,
                meeting_title=r.meeting_title,
                speaker=r.speaker,
                content=r.content,
                relevance_score=r.relevance_score,
            )
            for r in results
        ],
    )
