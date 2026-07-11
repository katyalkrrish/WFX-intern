from fastapi import APIRouter, HTTPException
from app.database.db import supabase

router = APIRouter()

@router.get("/")
def get_buyers():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("buyers").select("*").execute()
    # supabase-py v2 returns an APIResponse with .data
    return response.data
