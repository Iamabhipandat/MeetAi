"""
duplicate_detector.py

Core logic for Phase 7 – semantic duplicate detection.
It uses the embedding_service (Gemini or fallback) to generate a vector for a new question, then compares it to all existing non‑duplicate questions in the same meeting.
If the cosine similarity exceeds the configurable threshold, the new question is marked as a duplicate.
"""

import logging
from dataclasses import dataclass
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.question import Question, QuestionStatus
from app.services.embedding_service import get_embedding

logger = logging.getLogger(__name__)


@dataclass
class DuplicateResult:
    """Result returned by ``check_duplicate``.

    Attributes
    ----------
    is_duplicate: bool
        Whether the new question is considered a duplicate.
    duplicate_of: Optional[int]
        ``Question.id`` of the original question that this one duplicates (if any).
    similarity_score: Optional[float]
        Cosine similarity between the new embedding and the best match.
    embedding: Optional[List[float]]
        The embedding vector that was computed for the new question (stored in DB).
    """

    is_duplicate: bool = False
    duplicate_of: Optional[int] = None
    similarity_score: Optional[float] = None
    embedding: Optional[List[float]] = None


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Return cosine similarity between two vectors.

    If the vectors have different lengths, the similarity is defined as ``0.0``
    (they cannot be compared). This defensive check prevents runtime errors
    when a fallback embedding produces a different dimensionality (unlikely
    because both paths use the same ``DIM`` constant).
    """
    if len(vec_a) != len(vec_b) or not vec_a:
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = sum(a * a for a in vec_a) ** 0.5
    norm_b = sum(b * b for b in vec_b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _fetch_existing_embeddings(meeting_id: int, db: Session) -> List[Question]:
    """Return all *non‑duplicate* questions for the given meeting that already
    have an embedding stored.
    """
    return (
        db.query(Question)
        .filter(
            Question.meeting_id == meeting_id,
            Question.is_duplicate.is_(False),
            Question.embedding.is_not(None),
        )
        .all()
    )


def check_duplicate(new_question_text: str, meeting_id: int, db: Session) -> DuplicateResult:
    """Detect whether ``new_question_text`` is a duplicate of an existing question
    in the same meeting.

    Steps
    -----
    1. Compute the embedding for the new question using :func:`get_embedding`.
    2. Pull all existing non‑duplicate questions for the meeting that already have
       an embedding stored.
    3. Compute cosine similarity against each stored embedding.
    4. If the best similarity >= ``settings.SIMILARITY_THRESHOLD`` → duplicate.
    5. Return a :class:`DuplicateResult` containing the decision and the new
       embedding (so the caller can persist it).
    """
    result = DuplicateResult()
    try:
        # 1. Embed the incoming text
        embedding = get_embedding(new_question_text)
        result.embedding = embedding

        # 2. Load existing embeddings for the meeting
        existing_questions = _fetch_existing_embeddings(meeting_id, db)
        if not existing_questions:
            # No candidates to compare against → not a duplicate
            logger.debug("No existing embeddings for meeting %s; treating as new question", meeting_id)
            return result

        best_score = -1.0
        best_qid: Optional[int] = None
        for q in existing_questions:
            # stored embeddings are JSON‑encoded list of floats
            stored_vec = q.embedding
            if stored_vec is None:
                continue
            score = cosine_similarity(embedding, stored_vec)
            if score > best_score:
                best_score = score
                best_qid = q.id

        # 4. Apply threshold
        if best_score >= settings.SIMILARITY_THRESHOLD:
            result.is_duplicate = True
            result.duplicate_of = best_qid
            result.similarity_score = best_score
            logger.info(
                "Duplicate detected | meeting=%s | new_q='%s' | orig_q_id=%s | score=%.3f",
                meeting_id,
                new_question_text[:30],
                best_qid,
                best_score,
            )
        else:
            logger.debug(
                "No duplicate (best score %.3f) for question '%s' in meeting %s",
                best_score,
                new_question_text[:30],
                meeting_id,
            )
    except Exception as exc:
        logger.error("Error during duplicate detection: %s", exc)
        # In error case we simply treat as non‑duplicate and still return the embedding.
    return result
