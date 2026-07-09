import os
import io
import json
import base64
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import open_clip

# Vanna AI imports
from vanna.base import VannaBase
from vanna.chromadb import ChromaDB_VectorStore
from transformers import pipeline

app = Flask(__name__)
CORS(app)

device = "cpu"

# 1. OpenCLIP Setup
print("Loading OpenCLIP ViT-B-32...")
clip_model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai', device=device)
clip_tokenizer = open_clip.get_tokenizer('ViT-B-32')

# 2. Summarizer Setup
print("Loading summarizer...")
summarizer = pipeline("summarization", model="google/flan-t5-small", device=device)

# 3. Vanna Setup with Local Open-Source LLM
class LocalVanna(ChromaDB_VectorStore, VannaBase):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        VannaBase.__init__(self, config=config)
        
        # We use a SQL-focused lightweight model.
        # NOTE: t5-base is ~850MB which may exceed Render Free's 512MB RAM limit during generation.
        # If deployment fails due to OOM, consider downgrading to a smaller generic model or using quantization.
        print("Loading local SQL LLM...")
        try:
            self.pipe = pipeline("text2text-generation", model="mrm8488/t5-base-finetuned-wikiSQL", device=device)
        except Exception as e:
            print("Failed to load SQL model, falling back to flan-t5-small:", e)
            self.pipe = pipeline("text2text-generation", model="google/flan-t5-small", device=device)
        
    def system_message(self, message: str) -> any:
        return {"role": "system", "content": message}

    def user_message(self, message: str) -> any:
        return {"role": "user", "content": message}

    def assistant_message(self, message: str) -> any:
        return {"role": "assistant", "content": message}

    def submit_prompt(self, prompt, **kwargs):
        # prompt is a list of dicts. We convert it to a single string for our local text2text model.
        prompt_str = ""
        for msg in prompt:
            prompt_str += f"{msg['role'].upper()}: {msg['content']}\n"
            
        # Generate SQL from the prompt
        res = self.pipe(prompt_str, max_length=150)
        generated_text = res[0]['generated_text']
        
        # Vanna expects pure SQL returned. The model might add extra text, 
        # but Vanna's extract_sql will clean it.
        return generated_text

# Initialize Vanna with persistent storage
vn = LocalVanna(config={'path': './vanna_chroma_db'})

# Setup DB Connection for training
DB_URL = os.environ.get("DATABASE_URL")

@app.route("/train", methods=["POST"])
def train():
    """
    Extracts schema from PostgreSQL and trains Vanna's local ChromaDB.
    This should be called when the schema changes or on first deployment if persistent storage is lost.
    """
    if not DB_URL:
        return jsonify({"success": False, "message": "DATABASE_URL is not set"}), 500
        
    try:
        # Vanna's automatic training via information_schema
        print("Connecting to PostgreSQL for training...")
        conn = psycopg2.connect(DB_URL)
        cursor = conn.cursor()
        
        tables = ['buyers', 'suppliers', 'finished_goods', 'sales_orders', 'sales_invoices']
        
        for table in tables:
            # Extract DDL-like information
            cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            columns = cursor.fetchall()
            
            ddl_str = f"CREATE TABLE {table} ("
            ddl_str += ", ".join([f"{col[0]} {col[1]}" for col in columns])
            ddl_str += ");"
            
            print(f"Adding DDL for {table}")
            vn.train(ddl=ddl_str)
            
        conn.close()
        
        # Add basic documentation
        vn.train(documentation="The buyers table contains customer information.")
        vn.train(documentation="The suppliers table contains vendor information.")
        vn.train(documentation="The finished_goods table contains apparel products.")
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
        input_text = f"Question: {question}. Data: {json.dumps(rows[:3])}. Summarize."
        summary_result = summarizer(input_text, max_length=50, min_length=10, do_sample=False)
        return jsonify({"success": True, "summary": summary_result[0]['summary_text']})
    except Exception as e:
        return jsonify({"success": True, "summary": f"Found {len(rows)} results for your question."})

@app.route("/embed", methods=["POST"])
def embed():
    data = request.json
    image_base64 = data.get("image")
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
