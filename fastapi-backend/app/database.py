import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from typing import Generator
from .config import settings

# Create a connection pool
connection_pool = None


def init_db():
    """Initialize the database connection pool"""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1,  # minconn
            20,  # maxconn
            settings.database_url
        )
        print("✅ PostgreSQL Database pool created successfully")

        # Test connection
        conn = connection_pool.getconn()
        cursor = conn.cursor()
        cursor.execute("SELECT NOW()")
        cursor.close()
        connection_pool.putconn(conn)
        print(f"📍 Database: logifin@localhost:5432")

    except Exception as e:
        print(f"❌ Error creating database pool: {e}")
        raise


def close_db():
    """Close all connections in the pool"""
    global connection_pool
    if connection_pool:
        connection_pool.closeall()
        print("✅ PostgreSQL Database pool closed")


@contextmanager
def get_db_connection():
    """Get a database connection from the pool"""
    conn = None
    try:
        conn = connection_pool.getconn()
        yield conn
    finally:
        if conn:
            connection_pool.putconn(conn)


@contextmanager
def get_db_cursor(commit: bool = False):
    """Get a database cursor with automatic connection management"""
    with get_db_connection() as conn:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            cursor.close()


def get_db() -> Generator:
    """Dependency for FastAPI to get database cursor"""
    with get_db_cursor(commit=True) as cursor:
        yield cursor
