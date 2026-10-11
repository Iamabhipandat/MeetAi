"""Tests for transcript endpoints."""

from tests.conftest import client, register_and_login, create_active_meeting


def test_add_transcript():
    h = register_and_login(email="trans@test.com")
    m = create_active_meeting(h)
    resp = client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "Hello everyone."
    }, headers=h)
    assert resp.status_code == 201
    assert resp.json()["speaker"] == "Alice"
    assert resp.json()["sequence_number"] == 1


def test_list_transcripts():
    h = register_and_login(email="trans2@test.com")
    m = create_active_meeting(h)
    for i in range(3):
        client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": f"Speaker{i}", "content": f"Line {i}"
        }, headers=h)
    resp = client.get(f"/api/transcripts/meeting/{m['id']}", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 3


def test_transcript_sequence_numbers():
    h = register_and_login(email="trans3@test.com")
    m = create_active_meeting(h)
    for i in range(3):
        client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": "Alice", "content": f"Line {i}"
        }, headers=h)
    transcripts = client.get(f"/api/transcripts/meeting/{m['id']}", headers=h).json()
    seq_nums = [t["sequence_number"] for t in transcripts]
    assert seq_nums == [1, 2, 3]


def test_transcript_requires_active_meeting():
    h = register_and_login(email="trans4@test.com")
    m = client.post("/api/meetings/", json={"title": "Scheduled"}, headers=h).json()
    # Meeting is SCHEDULED, not ACTIVE
    resp = client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "Test"
    }, headers=h)
    assert resp.status_code == 400


def test_transcript_not_found():
    h = register_and_login(email="trans5@test.com")
    resp = client.get("/api/transcripts/9999", headers=h)
    assert resp.status_code == 404


def test_cross_user_transcript_isolation():
    h1 = register_and_login(email="t_user1@test.com", name="U1")
    m = create_active_meeting(h1)
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "Secret"
    }, headers=h1)

    h2 = register_and_login(email="t_user2@test.com", name="U2")
    resp = client.get(f"/api/transcripts/meeting/{m['id']}", headers=h2)
    assert resp.status_code == 404


def test_full_flow_simulation():
    h = register_and_login(email="flow@test.com")
    m = create_active_meeting(h)
    lines = [
        ("Alice", "Let's discuss the architecture."),
        ("Bob", "What framework should we use?"),
        ("Alice", "I suggest FastAPI for the backend."),
        ("Charlie", "Why FastAPI over Django?"),
        ("Alice", "FastAPI has better async support and auto-docs."),
    ]
    for speaker, content in lines:
        resp = client.post("/api/transcripts/", json={
            "meeting_id": m["id"], "speaker": speaker, "content": content
        }, headers=h)
        assert resp.status_code == 201
    transcripts = client.get(f"/api/transcripts/meeting/{m['id']}", headers=h).json()
    assert len(transcripts) == 5
