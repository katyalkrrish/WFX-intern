import os
import json
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import open_clip
import google.generativeai as genai

# Vanna AI imports
from vanna.chromadb import ChromaDB_VectorStore
from vanna.google import GoogleGeminiChat

app = Flask(__name__)
CORS(app)

device = "cpu"

# 1. OpenCLIP Setup (Text-to-Image only for Phase 1)
print("Loading OpenCLIP ViT-B-32 (Text Encoder)...")
clip_model, _, _ = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai', device=device)
clip_tokenizer = open_clip.get_tokenizer('ViT-B-32')

# 2. Vanna Setup using Official GoogleGeminiChat
class SimplifiedVanna(ChromaDB_VectorStore, GoogleGeminiChat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        GoogleGeminiChat.__init__(self, config=config)

gemini_api_key = os.environ.get('GEMINI_API_KEY')
if not gemini_api_key:
    print("WARNING: GEMINI_API_KEY is not set. Vanna SQL generation will fail.")
else:
    genai.configure(api_key=gemini_api_key)

vn = SimplifiedVanna(config={
    'api_key': gemini_api_key,
    'model': 'gemini-2.5-flash',
    'path': './vanna_chroma_db'
})

# Setup DB Connection for training
DB_URL = os.environ.get("DATABASE_URL")

@app.route("/train", methods=["POST"])
def train():
    """
    Extracts schema from PostgreSQL and trains Vanna's local ChromaDB.
    """
    if not DB_URL:
        return jsonify({"success": False, "message": "DATABASE_URL is not set"}), 500
        
    try:
        print("Connecting to PostgreSQL for training...")
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        
        tables = ['buyers', 'suppliers', 'finished_goods', 'sales_orders', 'sales_invoices']
        
        for table in tables:
            cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            columns = cursor.fetchall()
            
            ddl_str = f"CREATE TABLE {table} ("
            ddl_str += ", ".join([f"{col[0]} {col[1]}" for col in columns])
            ddl_str += ");"
            
            print(f"Adding DDL for {table}")
            vn.train(ddl=ddl_str)
            
        conn.close()
        
        vn.train(documentation="The buyers table contains customer information.")
        vn.train(documentation="The suppliers table contains vendor information.")
        vn.train(documentation="The finished_goods table contains apparel products. Products have a match_score when doing vector searches, but inside Postgres use standard filtering.")
        vn.train(documentation="The sales_orders table links buyers to finished_goods.")
        vn.train(documentation="The sales_invoices table links to sales_orders for payment tracking.")
        
        return jsonify({"success": True, "message": "Vanna successfully trained on PostgreSQL schema."})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/nl2sql", methods=["POST"])
def nl2sql():
    data = request.json
    question = data.get("question")
    if not question:
        return jsonify({"success": False, "message": "Question is required"}), 400
    
    try:
        sql = vn.generate_sql(question=question)
        return jsonify({"success": True, "generatedSQL": sql})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.json
    question = data.get("question")
    rows = data.get("rows", [])
    
    try:
        if not gemini_api_key:
            raise Exception("GEMINI_API_KEY is not set.")
            
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"Summarize these database query results in 1-2 simple sentences.\nQuestion: {question}\nData: {json.dumps(rows[:3])}"
        response = model.generate_content(prompt)
        
        return jsonify({"success": True, "summary": response.text.strip()})
    except Exception as e:
        print("Summarizer error:", e)
        return jsonify({"success": True, "summary": f"Found {len(rows)} results for your question."})

@app.route("/embed", methods=["POST"])
def embed():
    data = request.json
    text_query = data.get("text")
    
    try:
        with torch.no_grad():
            if text_query:
                text_tokens = clip_tokenizer([text_query]).to(device)
                features = clip_model.encode_text(text_tokens)
            else:
                return jsonify({"success": False, "message": "Provide text query for search (Phase 1 supports text-to-image only)"}), 400
                
            features /= features.norm(dim=-1, keepdim=True)
            embedding = features.cpu().numpy()[0].tolist()
            
            return jsonify({"success": True, "embedding": embedding})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
