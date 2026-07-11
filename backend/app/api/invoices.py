from fastapi import APIRouter, HTTPException
from app.database.db import supabase

router = APIRouter()

@router.get("/")
def get_invoices():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    response = supabase.table("sales_invoices").select("*").execute()
    return response.data
