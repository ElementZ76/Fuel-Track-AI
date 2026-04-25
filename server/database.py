"""
Database configuration for FuelTrack AI.

SQLAlchemy engine + session factory targeting a local SQLite file.
Uses check_same_thread=False for FastAPI compatibility (multiple threads).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file — auto-created on first run
SQLALCHEMY_DATABASE_URL = "sqlite:///./server/fueltrack.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session.
    Ensures the session is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
