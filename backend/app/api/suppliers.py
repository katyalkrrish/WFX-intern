from fastapi import APIRouter, HTTPException
from app.database.db import supabase

router = APIRouter()

@router.get("/")
def get_suppliers():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("suppliers").select("*").execute()
    return response.data
