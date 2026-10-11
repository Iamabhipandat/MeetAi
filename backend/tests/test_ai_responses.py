"""Tests for AI response generation endpoint."""

from tests.conftest import client, register_and_login, create_active_meeting


def test_generate_ai_answer():
    h = register_and_login(email="ai@test.com")
    m = create_active_meeting(h)

    # Add transcript lines
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "We are using PostgreSQL for the database."
    }, headers=h)
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Bob", "content": "What database are we using?"
    }, headers=h)

    # Get the detected question
    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    assert len(questions) >= 1
    q_id = questions[0]["id"]

    # Generate AI answer
    resp = client.post(f"/api/ai/questions/{q_id}/answer", headers=h)
    assert resp.status_code == 201
    data = resp.json()
    assert data["question_id"] == q_id
    assert len(data["response_text"]) > 0


def test_list_ai_responses():
    h = register_and_login(email="ai2@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Bob", "content": "Why did we pick Python?"
    }, headers=h)

    questions = client.get(f"/api/questions/meeting/{m['id']}", headers=h).json()
    q_id = questions[0]["id"]

    # Generate answer
    client.post(f"/api/ai/questions/{q_id}/answer", headers=h)

    # List responses
    resp = client.get(f"/api/ai/questions/{q_id}/responses", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_generate_answer_not_found():
    h = register_and_login(email="ai3@test.com")
    resp = client.post("/api/ai/questions/9999/answer", headers=h)
    assert resp.status_code == 404
