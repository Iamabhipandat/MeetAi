from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# SQLite needs check_same_thread=False; PostgreSQL does not
_uri = settings.SQLALCHEMY_DATABASE_URI
_kwargs = {"connect_args": {"check_same_thread": False}} if _uri.startswith("sqlite") else {}

engine = create_engine(_uri, **_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
