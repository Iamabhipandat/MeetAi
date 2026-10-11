"""Tests for authentication endpoints."""

from tests.conftest import client


def test_register_user():
    resp = client.post("/api/auth/register", json={
        "name": "Test User", "email": "auth@test.com", "password": "pass123"
    })
    assert resp.status_code == 201
    assert resp.json()["user"]["email"] == "auth@test.com"


def test_register_duplicate_email():
    client.post("/api/auth/register", json={
        "name": "User1", "email": "dup@test.com", "password": "pass123"
    })
    resp = client.post("/api/auth/register", json={
        "name": "User2", "email": "dup@test.com", "password": "pass456"
    })
    assert resp.status_code == 400


def test_login_success():
    client.post("/api/auth/register", json={
        "name": "Login User", "email": "login@test.com", "password": "pass123"
    })
    resp = client.post("/api/auth/login", json={
        "email": "login@test.com", "password": "pass123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password():
    client.post("/api/auth/register", json={
        "name": "Wrong Pass", "email": "wrong@test.com", "password": "correct"
    })
    resp = client.post("/api/auth/login", json={
        "email": "wrong@test.com", "password": "incorrect"
    })
    assert resp.status_code == 401


def test_get_me():
    client.post("/api/auth/register", json={
        "name": "Me User", "email": "me@test.com", "password": "pass123"
    })
    token = client.post("/api/auth/login", json={
        "email": "me@test.com", "password": "pass123"
    }).json()["access_token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@test.com"


def test_get_me_unauthorized():
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
