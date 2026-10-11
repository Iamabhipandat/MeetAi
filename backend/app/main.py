from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, meetings, transcripts, questions, ai, summary, search, analytics, rooms
from app.websocket_manager import manager

# Register all models
import app.models.user
import app.models.meeting
import app.models.transcript
import app.models.question
import app.models.ai_response
import app.models.meeting_summary
import app.models.room

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(auth.router,        prefix=settings.API_V1_STR)
app.include_router(meetings.router,    prefix=settings.API_V1_STR)
app.include_router(transcripts.router, prefix=settings.API_V1_STR)
app.include_router(questions.router,   prefix=settings.API_V1_STR)
app.include_router(ai.router,          prefix=settings.API_V1_STR)
app.include_router(summary.router,     prefix=settings.API_V1_STR)
app.include_router(search.router,      prefix=settings.API_V1_STR)
app.include_router(analytics.router,   prefix=settings.API_V1_STR)
app.include_router(rooms.router,       prefix=settings.API_V1_STR)


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws/meetings/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: int):
    await manager.connect(websocket, meeting_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, meeting_id)


@app.get("/")
def root():
    return {"message": "MeetAI API", "version": "2.0"}


@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {"status": "ok"}
