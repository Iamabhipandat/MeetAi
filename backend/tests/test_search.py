"""Tests for search endpoint."""

from tests.conftest import client, register_and_login, create_active_meeting


def test_search_finds_matching_transcript():
    h = register_and_login(email="search@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "We are using PostgreSQL for the database."
    }, headers=h)
    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Bob", "content": "The frontend uses React with TypeScript."
    }, headers=h)

    resp = client.get("/api/search/?q=PostgreSQL", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_results"] >= 1
    assert "PostgreSQL" in data["results"][0]["content"]


def test_search_no_results():
    h = register_and_login(email="search2@test.com")
    m = create_active_meeting(h)

    client.post("/api/transcripts/", json={
        "meeting_id": m["id"], "speaker": "Alice", "content": "We discussed the project timeline."
    }, headers=h)

    resp = client.get("/api/search/?q=kubernetes", headers=h)
    assert resp.status_code == 200
    assert resp.json()["total_results"] == 0


def test_search_filter_by_meeting():
    h = register_and_login(email="search3@test.com")
    m1 = create_active_meeting(h, title="Meeting 1")

    client.post("/api/transcripts/", json={
        "meeting_id": m1["id"], "speaker": "Alice", "content": "Database discussion here."
    }, headers=h)

    resp = client.get(f"/api/search/?q=Database&meeting_id={m1['id']}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["total_results"] >= 1


def test_search_cross_user_isolation():
    h1 = register_and_login(email="user1@test.com", name="User1")
    m1 = create_active_meeting(h1)
    client.post("/api/transcripts/", json={
        "meeting_id": m1["id"], "speaker": "Alice", "content": "Secret database info."
    }, headers=h1)

    h2 = register_and_login(email="user2@test.com", name="User2")

    # User2 should NOT see User1's transcripts
    resp = client.get("/api/search/?q=Secret", headers=h2)
    assert resp.json()["total_results"] == 0
