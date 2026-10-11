from typing import List
from pydantic import BaseModel


class SearchResultItem(BaseModel):
    transcript_id: int
    meeting_id: int
    meeting_title: str
    speaker: str
    content: str
    relevance_score: float


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]
