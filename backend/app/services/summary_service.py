"""
summary_service.py

Generates meeting summaries using Gemini.
Extracts key decisions, action items, and important discussions.
"""

import logging
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.transcript import Transcript
from app.models.question import Question, QuestionStatus

logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """You are an AI meeting assistant. Generate a comprehensive meeting summary from the transcript below.

Include these sections:
1. **Meeting Overview** - Brief description of what was discussed
2. **Key Decisions** - Important decisions made during the meeting
3. **Action Items** - Tasks assigned or mentioned
4. **Important Discussions** - Key topics that were debated or discussed at length
5. **Unanswered Questions** - Questions that were raised but not resolved

Meeting Transcript:
\"\"\"
{transcript}
\"\"\"

{unanswered_section}

Provide the summary in a clear, structured format:
"""


def _build_transcript_text(meeting_id: int, db: Session) -> str:
    entries = (
        db.query(Transcript)
        .filter(Transcript.meeting_id == meeting_id)
        .order_by(Transcript.sequence_number.asc())
        .all()
    )
    return "\n".join(f"{e.speaker}: {e.content}" for e in entries)


def _get_unanswered_questions(meeting_id: int, db: Session) -> str:
    questions = (
        db.query(Question)
        .filter(
            Question.meeting_id == meeting_id,
            Question.status == QuestionStatus.UNANSWERED,
        )
        .all()
    )
    if not questions:
        return ""
    lines = [f"- {q.speaker}: {q.question_text}" for q in questions]
    return "Unanswered questions from the meeting:\n" + "\n".join(lines)


def generate_meeting_summary(meeting_id: int, db: Session) -> str:
    """
    Generate a comprehensive meeting summary.
    Uses Gemini if API key is set, otherwise returns a basic text summary.
    """
    transcript_text = _build_transcript_text(meeting_id, db)

    if not transcript_text:
        return "No transcript data available for this meeting."

    unanswered = _get_unanswered_questions(meeting_id, db)

    if not settings.GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set — generating basic summary.")
        entry_count = len(transcript_text.split("\n"))
        unanswered_questions = (
            db.query(Question)
            .filter(
                Question.meeting_id == meeting_id,
                Question.status == QuestionStatus.UNANSWERED,
            )
            .all()
        )
        total_questions = (
            db.query(Question)
            .filter(Question.meeting_id == meeting_id)
            .count()
        )
        summary = "## Meeting Summary\n\n"
        summary += f"- **Total transcript entries:** {entry_count}\n"
        summary += f"- **Total questions detected:** {total_questions}\n"
        summary += f"- **Unanswered questions:** {len(unanswered_questions)}\n"
        if unanswered_questions:
            summary += "\n### Unanswered Questions\n"
            for q in unanswered_questions:
                summary += f"- {q.speaker}: {q.question_text}\n"
        return summary

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = SUMMARY_PROMPT.format(
            transcript=transcript_text,
            unanswered_section=unanswered,
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as exc:
        logger.error("Gemini summary generation failed: %s", exc)
        return f"Summary generation failed: {exc}"
