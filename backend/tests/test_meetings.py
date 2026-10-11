"""Tests for meeting CRUD endpoints."""

from tests.conftest import client, register_and_login


def test_create_meeting():
    h = register_and_login(email="meet@test.com")
    resp = client.post("/api/meetings/", json={"title": "Sprint Planning"}, headers=h)
    assert resp.status_code == 201
    assert resp.json()["title"] == "Sprint Planning"
    assert resp.json()["status"] == "SCHEDULED"


def test_list_meetings():
    h = register_and_login(email="meet2@test.com")
    client.post("/api/meetings/", json={"title": "Meeting 1"}, headers=h)
    client.post("/api/meetings/", json={"title": "Meeting 2"}, headers=h)
    resp = client.get("/api/meetings/", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_start_meeting():
    h = register_and_login(email="meet3@test.com")
    m = client.post("/api/meetings/", json={"title": "Test"}, headers=h).json()
    resp = client.post(f"/api/meetings/{m['id']}/start", headers=h)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ACTIVE"


def test_finish_meeting():
    h = register_and_login(email="meet4@test.com")
    m = client.post("/api/meetings/", json={"title": "Test"}, headers=h).json()
    client.post(f"/api/meetings/{m['id']}/start", headers=h)
    resp = client.post(f"/api/meetings/{m['id']}/finish", headers=h)
    assert resp.status_code == 200
    assert resp.json()["status"] == "ENDED"


def test_update_meeting():
    h = register_and_login(email="meet5@test.com")
    m = client.post("/api/meetings/", json={"title": "Old Title"}, headers=h).json()
    resp = client.patch(f"/api/meetings/{m['id']}", json={"title": "New Title"}, headers=h)
    assert resp.status_code == 200
    assert resp.json()["title"] == "New Title"


def test_delete_meeting():
    h = register_and_login(email="meet6@test.com")
    m = client.post("/api/meetings/", json={"title": "Delete Me"}, headers=h).json()
    resp = client.delete(f"/api/meetings/{m['id']}", headers=h)
    assert resp.status_code == 204


def test_meeting_not_found():
    h = register_and_login(email="meet7@test.com")
    resp = client.get("/api/meetings/9999", headers=h)
    assert resp.status_code == 404


def test_cross_user_isolation():
    h1 = register_and_login(email="user_a@test.com", name="A")
    h2 = register_and_login(email="user_b@test.com", name="B")
    m = client.post("/api/meetings/", json={"title": "Private"}, headers=h1).json()
    resp = client.get(f"/api/meetings/{m['id']}", headers=h2)
    assert resp.status_code == 404


def test_cannot_start_ended_meeting():
    h = register_and_login(email="meet8@test.com")
    m = client.post("/api/meetings/", json={"title": "Test"}, headers=h).json()
    client.post(f"/api/meetings/{m['id']}/start", headers=h)
    client.post(f"/api/meetings/{m['id']}/finish", headers=h)
    resp = client.post(f"/api/meetings/{m['id']}/start", headers=h)
    assert resp.status_code == 400
