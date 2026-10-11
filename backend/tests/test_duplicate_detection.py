"""Tests for semantic duplicate detection."""

import math
from tests.conftest import client, register_and_login, create_active_meeting
from app.services.embedding_service import _fallback_embedding
from app.services.duplicate_detector import cosine_similarity


# ─── Unit: cosine_similarity ──────────────────────────────────────────────────

def test_cosine_identical_vectors():
    v = [1.0, 0.5, 0.25]
    assert cosine_similarity(v, v) > 0.999


def test_cosine_orthogonal_vectors():
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert abs(cosine_similarity(a, b)) < 0.001


def test_cosine_mismatched_lengths():
    assert cosine_similarity([1.0, 2.0], [1.0]) == 0.0


# ─── Unit: fallback embedding ────────────────────────────────────────────────

def test_fallback_embedding_is_normalised():
    vec = _fallback_embedding("What database are we using?")
    magnitude = math.sqrt(sum(x * x for x in vec))
    assert abs(magnitude - 1.0) < 0.001


def test_fallback_same_text_identical():
    v1 = _fallback_embedding("Why are we using PostgreSQL?")
    v2 = _fallback_embedding("Why are we using PostgreSQL?")
    assert v1 == v2


def test_fallback_different_topics_lower_similarity():
    v1 = _fallback_embedding("What database are we using?")
    v2 = _fallback_embedding("When is the next team lunch?")
    assert cosine_similarity(v1, v2) < 0.9


# ─── Integration: duplicate detection via API ────────────────────────────────

def test_identical_question_marked_duplicate():
    h = register_and_login(email="dup@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Rahul",
        "content": "What database are we using?"
    }, headers=h)
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Priya",
        "content": "What database are we using?"
    }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    assert len(questions) == 2
    statuses = {q["status"] for q in questions}
    assert "UNANSWERED" in statuses
    assert "DUPLICATE" in statuses


def test_duplicate_stores_metadata():
    h = register_and_login(email="dup2@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Rahul",
        "content": "What database are we using?"
    }, headers=h)
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Priya",
        "content": "What database are we using?"
    }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    dup = next(q for q in questions if q["status"] == "DUPLICATE")
    assert dup["is_duplicate"] is True
    assert dup["duplicate_of"] is not None
    assert dup["similarity_score"] is not None
    assert dup["similarity_score"] > 0.8


def test_different_question_not_duplicate():
    h = register_and_login(email="dup3@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Rahul",
        "content": "What database are we using?"
    }, headers=h)
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Priya",
        "content": "When is the project deadline?"
    }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    statuses = [q["status"] for q in questions]
    assert "DUPLICATE" not in statuses


def test_full_meeting_with_duplicates():
    h = register_and_login(email="dup4@test.com")
    m = create_active_meeting(h)

    lines = [
        ("Rahul", "What database are we using?"),
        ("Abhinav", "We are using PostgreSQL."),
        ("Priya", "Why did we choose PostgreSQL?"),
        ("Dev", "Good discussion everyone."),
        ("Rahul", "What database are we using?"),  # duplicate
    ]
    for speaker, content in lines:
        client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": speaker, "content": content
        }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    assert len(questions) == 3
    statuses = [q["status"] for q in questions]
    assert statuses.count("UNANSWERED") == 2
    assert statuses.count("DUPLICATE") == 1
