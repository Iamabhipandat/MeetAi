import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "MeetAI"
    API_V1_STR: str = "/api"

    # Direct DB URL override (SQLite for local dev or default standalone)
    DATABASE_URL: Optional[str] = "sqlite:///./meetai.db"

    # PostgreSQL Settings (optional, only used if postgres environment provided)
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_PORT: Optional[str] = "5432"
    POSTGRES_DB: Optional[str] = None

    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # AI
    GEMINI_API_KEY: str = ""
    SIMILARITY_THRESHOLD: float = 0.85

    # Email (Gmail SMTP)
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    # LiveKit
    LIVEKIT_URL: str = "ws://localhost:7880"
    LIVEKIT_API_KEY: str = "devkey"
    LIVEKIT_API_SECRET: str = "secret"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.POSTGRES_USER and self.POSTGRES_SERVER and self.POSTGRES_DB:
            return (
                f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )
        if self.DATABASE_URL:
            if self.DATABASE_URL.startswith("postgresql://"):
                return self.DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
            if os.environ.get("VERCEL") and self.DATABASE_URL.startswith("sqlite"):
                return "sqlite:////tmp/meetai.db"
            return self.DATABASE_URL
        if os.environ.get("VERCEL"):
            return "sqlite:////tmp/meetai.db"
        return "sqlite:///./meetai.db"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
