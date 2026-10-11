"""
ai_response_service.py

Generates contextual AI responses to meeting questions using Gemini.
Retrieves relevant transcript context and feeds it to the LLM.
"""

import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transcript import Transcript

logger = logging.getLogger(__name__)

RESPONSE_PROMPT = """You are an AI meeting assistant. A participant asked a question during a meeting.

Your task: Answer the question using ONLY the meeting transcript provided below.
If the answer is not in the transcript, say "This question was not addressed in the meeting."

Meeting Transcript:
\"\"\"
{transcript}
\"\"\"

Question: {question}

Provide a concise, helpful answer:
"""


def _build_transcript_context(meeting_id: int, db: Session) -> str:
    """Concatenate all transcript entries for a meeting into a single string."""
    entries = (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting_id)
        .order_by(Transcript.sequence_number.asc())
        .all()
    )
    return "\n".join(f"{e.speaker}: {e.content}" for e in entries)


def generate_ai_response(
    question_text: str,
    meeting_id: int,
    db: Session,
) -> str:
    """
    Generate an AI response to a meeting question.
    Uses Gemini if API key is set, otherwise returns a fallback message.
    """
    transcript_context = _build_transcript_context(meeting_id, db)

    if not transcript_context:
        return "No transcript data available for this meeting."

    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set — returning fallback response.")
        return (
            f"AI response unavailable (no API key configured). "
            f"The question '{question_text}' was asked during the meeting. "
            f"Please review the transcript for context."
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = RESPONSE_PROMPT.format(
            transcript=transcript_context,
            question=question_text,
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as exc:
        logger.error("Gemini AI response failed: %s", exc)
        return "AI response generation failed. Please review the transcript manually."
