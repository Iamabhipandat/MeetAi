"""Tests for question detection and question endpoints."""

from unittest.mock import patch, MagicMock
from tests.conftest import client, register_and_login, create_active_meeting
from app.services.question_detector import _heuristic_detection


# ─── Heuristic Detection Unit Tests ──────────────────────────────────────────

def test_heuristic_detects_question_mark():
    result = _heuristic_detection("What database are we using?")
    assert result.is_question is True
    assert result.question_text == "What database are we using?"


def test_heuristic_detects_interrogative_word():
    result = _heuristic_detection("Why did we choose PostgreSQL")
    assert result.is_question is True


def test_heuristic_ignores_statement():
    result = _heuristic_detection("We decided to use PostgreSQL for the project.")
    assert result.is_question is False


def test_heuristic_detects_can():
    result = _heuristic_detection("Can we use Redis for caching?")
    assert result.is_question is True


# ─── Integration: transcript → auto question detection ────────────────────────

def test_question_auto_detected_on_transcript_submit():
    h = register_and_login(email="qdet@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Rahul",
        "content": "What database are we using?"
    }, headers=h)

    res = client.get(f"/api/questions/meeting/{m['id']}", headers=h)
    assert res.status_code == 200
    questions = res.json()
    assert len(questions) == 1
    assert "database" in questions[0]["question_text"].lower()
    assert questions[0]["status"] == "UNANSWERED"


def test_statement_does_not_create_question():
    h = register_and_login(email="qdet2@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Abhinav",
        "content": "We decided to go with PostgreSQL for our database."
    }, headers=h)

    res = client.get(f"/api/questions/meeting/{m['id']}", headers=h)
    assert res.status_code == 200
    assert len(res.json()) == 0


def test_multiple_questions_detected():
    h = register_and_login(email="qdet3@test.com")
    m = create_active_meeting(h)

    lines = [
        ("Rahul", "What database are we using?"),
        ("Abhinav", "We are using PostgreSQL."),
        ("Priya", "Why did we choose PostgreSQL?"),
        ("Rahul", "Who made this decision?"),
    ]
    for speaker, content in lines:
        client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": speaker, "content": content
        }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    assert len(questions) >= 2


def test_update_question_status():
    h = register_and_login(email="qdet4@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Rahul",
        "content": "Why are we using PostgreSQL?"
    }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    assert len(questions) >= 1
    q_id = questions[0]["id"]

    res = client.patch(f"/api/questions/{q_id}/status",
                       json={"status": "ANSWERED"}, headers=h)
    assert res.status_code == 200
    assert res.json()["status"] == "ANSWERED"
