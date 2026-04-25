"""
Database configuration for FuelTrack AI.

SQLAlchemy engine + session factory targeting a local SQLite file.
Uses check_same_thread=False for FastAPI compatibility (multiple threads).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file — auto-created on first run
SQLALCHEMY_DATABASE_URL = "sqlite:///./server/fueltrack.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Required for SQLite + FastAPI
)


@event.listens_for(engine, "connect")
def set_sqlite_pragmas(dbapi_connection, connection_record):
    """
    Apply critical SQLite PRAGMA settings on every new connection.

    - foreign_keys=ON  : SQLite does NOT enforce FK constraints by default.
                         This makes cascade deletes and FK validation actually work.
    - journal_mode=WAL : Write-Ahead Logging — better read/write concurrency.
    - synchronous=NORMAL: Balanced durability without full fsync on every write.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

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
