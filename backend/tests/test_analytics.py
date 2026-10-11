"""Tests for analytics endpoint."""

from tests.conftest import client, register_and_login, create_active_meeting


def test_analytics_empty():
    h = register_and_login(email="analytics@test.com")
    resp = client.get("/api/analytics/", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_meetings"] == 0
    assert data["total_transcripts"] == 0
    assert data["meetings"] == []


def test_analytics_with_data():
    h = register_and_login(email="analytics2@test.com")
    m = create_active_meeting(h)

    # Add transcripts with questions
    lines = [
        ("Alice", "We are using PostgreSQL."),
        ("Bob", "What database are we using?"),
        ("Charlie", "When is the deadline?"),
    ]
    for speaker, content in lines:
        client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": speaker, "content": content
        }, headers=h)

    resp = client.get("/api/analytics/", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_meetings"] == 1
    assert data["total_transcripts"] == 3
    assert data["total_questions"] >= 2
    assert len(data["meetings"]) == 1
    assert data["meetings"][0]["meeting_id"] == m["id"]


def test_analytics_cross_user_isolation():
    h1 = register_and_login(email="a1@test.com")
    create_active_meeting(h1)

    h2 = register_and_login(email="a2@test.com")
    resp = client.get("/api/analytics/", headers=h2)
    assert resp.json()["total_meetings"] == 0
