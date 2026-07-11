import os
from supabase import create_client, Client
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# Supabase Client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: Missing SUPABASE_URL or SUPABASE_SECRET_KEY")

# PostgreSQL Connection Pool
DATABASE_URL = os.environ.get("DATABASE_URL")

pg_pool = None
if DATABASE_URL:
    try:
        pg_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20,
            DATABASE_URL,
            sslmode='require'
        )
    except Exception as e:
        print(f"Error creating PostgreSQL pool: {e}")
else:
    print("Warning: Missing DATABASE_URL")

def get_db_connection():
    if not pg_pool:
        raise Exception("Database pool is not initialized")
    return pg_pool.getconn()

def execute_query(query: str, params: tuple = None, fetch_one=False):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            if fetch_one:
                res = cur.fetchone()
                return dict(res) if res else None
            return [dict(r) for r in cur.fetchall()]
    finally:
        release_db_connection(conn)

def release_db_connection(conn):
    if pg_pool:
        pg_pool.putconn(conn)
