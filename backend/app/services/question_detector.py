"""
question_detector.py

Responsibilities:
  - Analyse a transcript entry's text using Gemini.
  - Determine whether the text contains a question.
  - If yes, extract the question text cleanly.
  - Return a structured result.

This service is intentionally isolated from the router layer.
Swapping the AI provider only requires changing this file.
"""

import logging
import re
from dataclasses import dataclass
from typing import Optional

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class DetectionResult:
    is_question: bool
    question_text: Optional[str] = None  # cleaned / extracted question text


# ─── Prompt ───────────────────────────────────────────────────────────────────

DETECTION_PROMPT = """You are an AI assistant that analyses meeting transcripts.

Your task: Determine whether the following statement contains a question.

Rules:
- A question is any sentence that seeks information, clarification, or an opinion.
- Rhetorical statements that are phrased as questions ("Isn't that obvious?") still count.
- If the sentence contains a question, extract ONLY the question text. Remove filler words, speaker names, or non-question parts.
- Respond in this exact JSON format (no markdown, no extra text):

{{"is_question": true, "question_text": "Why are we using PostgreSQL?"}}

or

{{"is_question": false, "question_text": null}}

Statement to analyse:
\"\"\"{content}\"\"\"
"""


def _parse_response(raw: str) -> DetectionResult:
    """Parse Gemini's JSON response safely."""
    import json

    # Strip markdown code fences if present
    raw = re.sub(r"```(?:json)?", "", raw).strip()

    try:
        data = json.loads(raw)
        is_q = bool(data.get("is_question", False))
        q_text = data.get("question_text") if is_q else None
        return DetectionResult(is_question=is_q, question_text=q_text)
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning("Failed to parse question detection response: %s | raw=%s", exc, raw)
        # Fallback: use simple heuristic
        return _heuristic_detection(raw)


def _heuristic_detection(text: str) -> DetectionResult:
    """
    Lightweight fallback when the LLM response cannot be parsed.
    Checks for question marks or common interrogative words.
    """
    question_starters = (
        "what", "why", "how", "when", "where", "who", "which",
        "is", "are", "was", "were", "do", "does", "did",
        "can", "could", "should", "would", "will", "shall",
    )
    stripped = text.strip()
    lower = stripped.lower()

    if stripped.endswith("?"):
        return DetectionResult(is_question=True, question_text=stripped)

    first_word = lower.split()[0] if lower.split() else ""
    if first_word in question_starters:
        return DetectionResult(is_question=True, question_text=stripped)

    return DetectionResult(is_question=False)


# ─── Public API ───────────────────────────────────────────────────────────────

def detect_question(content: str) -> DetectionResult:
    """
    Main entry point.
    Uses Gemini if API key is configured, otherwise falls back to heuristic.
    Always returns a DetectionResult — never raises.
    """
    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set — using heuristic question detection.")
        return _heuristic_detection(content)

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = DETECTION_PROMPT.format(content=content)
        response = model.generate_content(prompt)
        return _parse_response(response.text)

    except Exception as exc:
        logger.error("Gemini question detection failed: %s — falling back to heuristic.", exc)
        return _heuristic_detection(content)
