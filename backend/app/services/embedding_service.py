"""
embedding_service.py

Generates vector embeddings for text using Gemini's embedding model.
Falls back to a simple TF-IDF-style bag-of-words vector when no API key is set.
This keeps tests fast and the app functional without an API key.
"""

import logging
import math
from collections import Counter
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "models/embedding-001"


def _gemini_embedding(text: str) -> List[float]:
    """Call Gemini embedding API and return the embedding vector."""
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="semantic_similarity",
    )
    return result["embedding"]


def _fallback_embedding(text: str) -> List[float]:
    """
    Lightweight TF-style embedding for offline/test use.
    Produces a 512-dim bag-of-words vector, L2-normalised.
    Not semantically rich — only used when GEMINI_API_KEY is absent.
    """
    DIM = 512
    tokens = text.lower().split()
    counts = Counter(tokens)
    vec = [0.0] * DIM
    for token, freq in counts.items():
        idx = hash(token) % DIM
        vec[idx] += freq

    # L2 normalise
    magnitude = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / magnitude for x in vec]


def get_embedding(text: str) -> List[float]:
    """
    Public entry point.
    Returns an embedding vector for the given text.
    Always returns a vector — never raises.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set — using fallback embedding.")
        return _fallback_embedding(text)

    try:
        return _gemini_embedding(text)
    except Exception as exc:
        logger.error("Gemini embedding failed: %s — using fallback.", exc)
        return _fallback_embedding(text)
