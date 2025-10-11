import os
from contextlib import contextmanager
from dotenv import load_dotenv
from sqlmodel import create_engine, Session

# Load environment variables from the .env file
load_dotenv()

# 1. Get the Database URL from the Environment
# This is the connection string for our PostgreSQL database.
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# 2. Create the Database Engine with Production-Ready Settings
# The engine is the central point of communication with the database.
# Pool settings are critical for Supabase free tier stability:
# - pool_pre_ping: Test connections before using them (catches stale connections)
# - pool_recycle: Recycle connections after 5 minutes (Supabase closes idle connections)
# - pool_size: Limit concurrent connections
# - max_overflow: Allow burst capacity
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True,  # Test connection before use
    pool_recycle=300,     # Recycle connections every 5 minutes
    pool_size=5,          # Base pool size
    max_overflow=10       # Allow up to 15 total connections
)

# 3. Context Manager for Transactional Database Sessions
@contextmanager
def get_db_session():
    """
    Provides a transactional database session with automatic commit/rollback.
    This ensures proper connection lifecycle management.
    """
    db = Session(engine)
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# 4. FastAPI Dependency for Database Sessions
def get_session():
    """
    FastAPI dependency that provides a database session.
    Uses the context manager to ensure proper cleanup.
    """
    with get_db_session() as session:
        yield session