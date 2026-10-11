"""
Shared test fixtures — provides a fresh SQLite DB and authenticated test client.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.user import User
from app.models.meeting import Meeting
from app.models.transcript import Transcript
from app.models.question import Question
from app.models.ai_response import AIResponse
from app.models.meeting_summary import MeetingSummary

from app.main import app
from app.core.database import Base, get_db


import os
from sqlalchemy.pool import NullPool

SQLALCHEMY_TEST_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_TEST_URL, 
    connect_args={"check_same_thread": False},
    poolclass=NullPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.drop_all(bind=engine)
    # Ensure fresh DB file
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except OSError:
            pass
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def register_and_login(email="test@test.com", password="pass123", name="Tester"):
    """Helper: register a user and return the auth header dict."""
    client.post("/api/auth/register", json={"name": name, "email": email, "password": password})
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_active_meeting(headers, title="Test Meeting"):
    """Helper: create a meeting and start it. Returns meeting dict."""
    m = client.post("/api/meetings/", json={"title": title}, headers=headers).json()
    client.post(f"/api/meetings/{m['id']}/start", headers=headers)
    return m
