# AI Meeting Assistant

A production-grade AI-powered meeting assistant that provides live transcription processing, intelligent question detection, duplicate question flagging, contextual AI responses, meeting summaries, searchable meeting history, and real-time analytics.

## Features

| Feature | Description |
|---------|-------------|
| **Live Transcription** | Ingest meeting transcript entries via REST API |
| **Question Detection** | AI-powered (Gemini) + heuristic fallback |
| **Duplicate Detection** | Semantic similarity using embeddings + cosine similarity |
| **AI Responses** | Context-aware answers using meeting transcript |
| **Meeting Summaries** | AI-generated summaries with key decisions & action items |
| **Search** | Full-text search across all meeting transcripts |
| **Analytics** | Per-meeting and overall statistics dashboard |
| **Real-time Updates** | WebSocket support for live meeting dashboards |
| **Authentication** | JWT-based auth with user isolation |

## Tech Stack

- **Backend:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0
- **Database:** PostgreSQL (SQLite for tests)
- **AI:** Google Gemini API (with heuristic/fallback for offline use)
- **Auth:** JWT (python-jose), bcrypt (passlib)
- **Migrations:** Alembic
- **Real-time:** WebSocket
- **Deployment:** Docker, Docker Compose

## Quick Start

### 1. Clone & Setup

```bash
cd D:\AI_Meeting_Assistant\backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### 2. Configure

```bash
copy .env.example .env
# Edit .env — set your GEMINI_API_KEY (optional) and database credentials
```

### 3. Run with Docker (recommended)

```bash
cd D:\AI_Meeting_Assistant
docker compose up --build
```

This starts PostgreSQL + the API server at `http://localhost:8000`.

### 4. Run without Docker

```bash
# Start PostgreSQL manually, then:
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### 5. Run Tests

```bash
pytest -v
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, get JWT token |
| GET | `/api/auth/me` | Get current user |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings/` | Create meeting |
| GET | `/api/meetings/` | List user's meetings |
| GET | `/api/meetings/{id}` | Get meeting details |
| PATCH | `/api/meetings/{id}` | Update meeting |
| POST | `/api/meetings/{id}/start` | Start meeting |
| POST | `/api/meetings/{id}/finish` | End meeting |
| DELETE | `/api/meetings/{id}` | Delete meeting |

### Transcripts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transcripts/` | Add transcript entry (auto-detects questions) |
| GET | `/api/transcripts/meeting/{id}` | List meeting transcripts |
| GET | `/api/transcripts/{id}` | Get single transcript |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions/meeting/{id}` | List detected questions |
| GET | `/api/questions/{id}` | Get single question |
| PATCH | `/api/questions/{id}/status` | Update question status |

### AI Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/questions/{id}/answer` | Generate AI answer |
| GET | `/api/ai/questions/{id}/responses` | List AI responses |

### Summaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/summaries/meeting/{id}` | Get/generate meeting summary |
| GET | `/api/summaries/meeting/{id}?regenerate=true` | Force regenerate |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/?q=query` | Search transcripts |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/` | Get overall analytics |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws/meetings/{id}` | Real-time meeting updates |

## Architecture

```
POST /api/transcripts/
    │
    ├── Save transcript entry
    │
    ├── Question Detection (Gemini / heuristic)
    │   └── Is question? ──yes──▶ Duplicate Detection
    │                              └── cosine_similarity(embedding, stored_embeddings)
    │                                  ├── score ≥ 0.85 → DUPLICATE
    │                                  └── score < 0.85 → UNANSWERED
    │
    └── Return transcript (AI failures never block response)
```

## Project Structure

```
backend/
├── app/
│   ├── core/           # Config, database, security
│   ├── models/         # SQLAlchemy models
│   ├── schemas/        # Pydantic schemas
│   ├── routers/        # FastAPI route handlers
│   ├── services/       # Business logic (AI, embeddings, search)
│   ├── websocket_manager.py
│   └── main.py         # App entry point
├── alembic/            # Database migrations
├── tests/              # Comprehensive test suite
├── Dockerfile
├── requirements.txt
└── .env.example
```

## License

MIT
