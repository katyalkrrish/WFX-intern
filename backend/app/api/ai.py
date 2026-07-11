from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import re

from app.ai.clip_service import generate_embedding
from app.ai.vanna_service import generate_sql, summarize_results, _do_train, get_vn
from app.ai.typesense_service import search_products
from app.database.db import execute_query

router = APIRouter()

class AskRequest(BaseModel):
    question: str

class ImageSearchRequest(BaseModel):
    image: str = None
    mimeType: str = None
    q: str = None

class EmbedRequest(BaseModel):
    text: str

class SummarizeRequest(BaseModel):
    question: str
    rows: list

@router.post("/ask")
def ask_question(req: AskRequest):
    question = req.question
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        # Normalize singular/plural
        norm = re.sub(r'\bshirts\b',   "shirt",   question, flags=re.IGNORECASE)
        norm = re.sub(r'\bhoodies\b',  "hoodie",  norm,     flags=re.IGNORECASE)
        norm = re.sub(r'\bjackets\b',  "jacket",  norm,     flags=re.IGNORECASE)
        norm = re.sub(r'\btrousers\b', "trouser", norm,     flags=re.IGNORECASE)

        sql = generate_sql(norm)

        # Clean markdown fences
        if "```sql" in sql:
            m = re.search(r'```sql\n(.*?)\n```', sql, re.DOTALL | re.IGNORECASE)
            sql = m.group(1).strip() if m else sql.replace("```sql", "").replace("```", "").strip()
        else:
            sql = sql.replace("```", "").strip()

        m2 = re.search(r'(SELECT.*)', sql, re.DOTALL | re.IGNORECASE)
        if m2:
            sql = m2.group(1).strip()

        if not sql.endswith(";"):
            sql += ";"

        if not sql.strip().upper().startswith("SELECT"):
            raise HTTPException(status_code=400, detail=f"Only SELECT queries are allowed. Generated: {sql}")

        rows = execute_query(sql)
        summary = summarize_results(question, rows)

        return {
            "success": True,
            "question": question,
            "generatedSQL": sql,
            "rows": rows,
            "summary": summary,
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search-image")
def image_search(req: ImageSearchRequest):
    if not req.q:
        raise HTTPException(status_code=400, detail="Provide text query for search (Phase 1 supports text-to-image only)")

    try:
        embedding = generate_embedding(req.q)
        results = search_products(text_query=req.q, embedding=embedding)
        
        return {
            "success": True,
            "tags": {"keywords": req.q},
            "data": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/embed")
def embed_text(req: EmbedRequest):
    try:
        embedding = generate_embedding(req.text)
        return {"success": True, "embedding": embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/summarize")
def summarize_endpoint(req: SummarizeRequest):
    try:
        summary = summarize_results(req.question, req.rows)
        return {"success": True, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/train")
def train_endpoint():
    try:
        _do_train()
        vn = get_vn()
        td = vn.get_training_data()
        ddl_cnt  = len(td[td["training_data_type"] == "ddl"]) if td is not None else 0
        doc_cnt  = len(td[td["training_data_type"] == "documentation"]) if td is not None else 0
        sql_cnt  = len(td[td["training_data_type"] == "sql"]) if td is not None else 0
        
        return {
            "success": True,
            "message": "Vanna successfully trained on PostgreSQL schema.",
            "stats": {
                "ddl_entries": ddl_cnt,
                "documentation_entries": doc_cnt,
                "sql_examples": sql_cnt,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
