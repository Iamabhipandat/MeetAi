"""Tests for meeting summary endpoint."""

from tests.conftest import client, register_and_login, create_active_meeting


def test_generate_summary():
    h = register_and_login(email="sum@test.com")
    m = create_active_meeting(h)

    # Add some transcript content
    lines = [
        ("Alice", "Let's discuss the database choice."),
        ("Bob", "What database are we using?"),
        ("Alice", "We're going with PostgreSQL."),
        ("Bob", "Sounds good. Who will handle the deployment?"),
        ("Alice", "I'll take care of it by Friday."),
    ]
    for speaker, content in lines:
        client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": speaker, "content": content
        }, headers=h)

    # Generate summary
    resp = client.get(f"/api/summaries/meeting/{m['id']}", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert data["meeting_id"] == m["id"]
    assert len(data["summary_text"]) > 0


def test_summary_cached_on_second_call():
    h = register_and_login(email="sum2@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "Let's talk about testing."
    }, headers=h)

    # First call generates
    r1 = client.get(f"/api/summaries/meeting/{m['id']}", headers=h)
    # Second call returns cached
    r2 = client.get(f"/api/summaries/meeting/{m['id']}", headers=h)
    assert r1.json()["id"] == r2.json()["id"]


def test_summary_regenerate():
    h = register_and_login(email="sum3@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "Discussion about APIs."
    }, headers=h)

    r1 = client.get(f"/api/summaries/meeting/{m['id']}", headers=h)
    r2 = client.get(f"/api/summaries/meeting/{m['id']}?regenerate=true", headers=h)
    # Regenerated should create a new record
    assert r2.json()["id"] != r1.json()["id"]


def test_summary_not_found():
    h = register_and_login(email="sum4@test.com")
    resp = client.get("/api/summaries/meeting/9999", headers=h)
    assert resp.status_code == 404
