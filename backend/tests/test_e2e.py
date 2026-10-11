"""
End-to-end integration test — simulates a complete meeting lifecycle.

1. Register + login
2. Create meeting → start it
3. Submit transcript entries (mix of questions & statements)
4. Verify questions were auto-detected
5. Verify duplicates were flagged
6. Generate AI answer for a question
7. Generate meeting summary
8. Search across transcripts
9. Check analytics
10. Finish meeting
"""

from tests.conftest import client, register_and_login, create_active_meeting


def test_full_meeting_lifecycle():
    # ── 1. Auth ────────────────────────────────────────────────────────────
    h = register_and_login(email="e2e@test.com", name="E2E Tester")

    # Verify /me
    me = client.get("/api/auth/me", headers=h)
    assert me.status_code == 200
    assert me.json()["email"] == "e2e@test.com"

    # ── 2. Create & start meeting ──────────────────────────────────────────
    m = create_active_meeting(h, title="Sprint Planning")
    meeting_id = m["id"]

    # ── 3. Submit transcript ───────────────────────────────────────────────
    lines = [
        ("Rahul",   "Good morning everyone. Let's start the sprint planning."),
        ("Priya",   "What database are we using for this project?"),
        ("Rahul",   "We decided to go with PostgreSQL."),
        ("Abhinav", "Why did we choose PostgreSQL over MongoDB?"),
        ("Rahul",   "PostgreSQL has better ACID compliance and JSON support."),
        ("Dev",     "What database are we using for this project?"),  # duplicate of Priya's question
        ("Priya",   "When is the deployment deadline?"),
        ("Rahul",   "The deployment is scheduled for next Friday."),
        ("Abhinav", "Who is responsible for the CI/CD pipeline?"),
    ]
    for speaker, content in lines:
        resp = client.post("/api/transcripts/", json={
            "meeting_id": meeting_id, "speaker": speaker, "content": content
        }, headers=h)
        assert resp.status_code == 201

    # ── 4. Verify transcripts ──────────────────────────────────────────────
    transcripts = client.get(f"/api/transcripts/meeting/{meeting_id}", headers=h).json()
    assert len(transcripts) == 9

    # ── 5. Verify questions detected ───────────────────────────────────────
    questions = client.get(f"/api/questions/meeting/{meeting_id}", headers=h).json()
    assert len(questions) >= 4  # at least 4 questions in the conversation

    # Check that at least one duplicate was detected
    statuses = [q["status"] for q in questions]
    assert "UNANSWERED" in statuses
    # Dev's question should be duplicate of Priya's (exact same text)
    duplicates = [q for q in questions if q["status"] == "DUPLICATE"]
    assert len(duplicates) >= 1
    assert duplicates[0]["is_duplicate"] is True
    assert duplicates[0]["similarity_score"] is not None

    # ── 6. Generate AI answer ──────────────────────────────────────────────
    unanswered = [q for q in questions if q["status"] == "UNANSWERED"]
    if unanswered:
        q_id = unanswered[0]["id"]
        ai_resp = client.post(f"/api/ai/questions/{q_id}/answer", headers=h)
        assert ai_resp.status_code == 201
        assert len(ai_resp.json()["response_text"]) > 0

        # Verify question is now ANSWERED
        q_updated = client.get(f"/api/questions/{q_id}", headers=h).json()
        assert q_updated["status"] == "ANSWERED"

    # ── 7. Generate summary ────────────────────────────────────────────────
    summary_resp = client.get(f"/api/summaries/meeting/{meeting_id}", headers=h)
    assert summary_resp.status_code == 200
    assert len(summary_resp.json()["summary_text"]) > 0

    # ── 8. Search ──────────────────────────────────────────────────────────
    search_resp = client.get("/api/search/?q=PostgreSQL", headers=h)
    assert search_resp.status_code == 200
    assert search_resp.json()["total_results"] >= 1

    # ── 9. Analytics ───────────────────────────────────────────────────────
    analytics = client.get("/api/analytics/", headers=h).json()
    assert analytics["total_meetings"] >= 1
    assert analytics["total_transcripts"] >= 9
    assert analytics["total_questions"] >= 4

    # ── 10. Finish meeting ─────────────────────────────────────────────────
    finish_resp = client.post(f"/api/meetings/{meeting_id}/finish", headers=h)
    assert finish_resp.status_code == 200
    assert finish_resp.json()["status"] == "ENDED"

    # Verify can't add transcript to ended meeting
    bad_resp = client.post("/api/transcripts/", json={
        "meeting_id": meeting_id, "speaker": "Late", "content": "Am I too late?"
    }, headers=h)
    assert bad_resp.status_code == 400
