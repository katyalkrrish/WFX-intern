from dotenv import load_dotenv

load_dotenv()
import os
import json
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import open_clip
import openai
from vanna.chromadb import ChromaDB_VectorStore
from vanna.openai import OpenAI_Chat

app = Flask(__name__)
CORS(app)

device = "cpu"

# 1. OpenCLIP Setup (Text-to-Image only for Phase 1)
print("Loading OpenCLIP ViT-B-32 (Text Encoder)...")
clip_model, _, _ = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai', device=device)
clip_tokenizer = open_clip.get_tokenizer('ViT-B-32')

# 2. Vanna Setup using Official GoogleGeminiChat + ChromaDB
class SimplifiedVanna(ChromaDB_VectorStore, OpenAI_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        OpenAI_Chat.__init__(self, config=config)
        self.or_client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=config.get("api_key"),
        )
        self.model_name = config.get("model")

    def submit_prompt(self, prompt, **kwargs) -> str:
        if isinstance(prompt, list):
            print(f"\nSQL Prompt (OpenAI Format):\n{json.dumps(prompt, indent=2)}\n")
            
            response = self.or_client.chat.completions.create(
                model=self.model_name,
                messages=prompt,
                temperature=self.temperature
            )
            text = response.choices[0].message.content
            print(f"\nLLM Response:\n{text}\n")
            return text
        else:
            # Fallback to parent behavior
            return super().submit_prompt(prompt, **kwargs)

openrouter_api_key = os.environ.get('OPENROUTER_API_KEY')
if not openrouter_api_key:
    print("WARNING: OPENROUTER_API_KEY is not set. Vanna SQL generation will fail.")

vn = SimplifiedVanna(config={
    "api_key": openrouter_api_key,
    "model": "openai/gpt-4.1-mini",
    "path": "./vanna_chroma_db"
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

        # Business Documentation
        vn.train(documentation="""
        The finished_goods table stores apparel inventory.

        Important columns:
        style_name -> Product name
        category -> Apparel type such as Shirt, Hoodie, Jacket, Trouser, T-Shirt
        color -> Product color
        print -> Pattern like Plain, Striped, Checked, Floral, Printed
        fabric -> Cotton, Denim, Polyester, Linen etc.
        brand -> Brand name
        supplier -> Supplier company
        season -> Summer, Winter, Spring etc.
        selling_price -> Selling price
        cost -> Cost price

        Use ILIKE for text searches whenever possible.
        Use LOWER(column)=LOWER(value) if exact matching is required.
        """)

        vn.train(documentation="The buyers table contains customer information with columns: buyer_id, company_name, country, buyer_category.")
        vn.train(documentation="The suppliers table contains vendor information with columns: supplier_id, company_name, country, contact, lead_time_days, rating.")
        vn.train(documentation="The sales_orders table links buyers to finished_goods with columns: order_number, buyer, style_number, quantity, unit_price, shipment_date, status.")
        vn.train(documentation="The sales_invoices table links to sales_orders for payment tracking with columns: invoice_number, sales_order, amount, currency, payment_status.")

        # Training Examples (question -> SQL pairs)
        examples = [
            ("Show all blue shirts", "SELECT * FROM finished_goods WHERE LOWER(category)='shirt' AND LOWER(color)='blue';"),
            ("Show blue striped shirts", "SELECT * FROM finished_goods WHERE LOWER(category)='shirt' AND LOWER(color)='blue' AND LOWER(print)='striped';"),
            ("Show all hoodies", "SELECT * FROM finished_goods WHERE LOWER(category)='hoodie';"),
            ("Show black hoodies", "SELECT * FROM finished_goods WHERE LOWER(category)='hoodie' AND LOWER(color)='black';"),
            ("Show denim products", "SELECT * FROM finished_goods WHERE LOWER(fabric)='denim';"),
            ("Show cotton shirts", "SELECT * FROM finished_goods WHERE LOWER(category)='shirt' AND LOWER(fabric)='cotton';"),
            ("Show products under 1000", "SELECT * FROM finished_goods WHERE selling_price < 1000;"),
            ("Show products above 3000", "SELECT * FROM finished_goods WHERE selling_price > 3000;"),
            ("Show Nike products", "SELECT * FROM finished_goods WHERE LOWER(brand)='nike';"),
            ("Show Adidas hoodies", "SELECT * FROM finished_goods WHERE LOWER(brand)='adidas' AND LOWER(category)='hoodie';"),
            ("Show summer collection", "SELECT * FROM finished_goods WHERE LOWER(season)='summer';"),
            ("Show winter jackets", "SELECT * FROM finished_goods WHERE LOWER(category)='jacket' AND LOWER(season)='winter';"),
            ("Show products supplied by ABC Textiles", "SELECT * FROM finished_goods WHERE supplier ILIKE '%ABC Textiles%';"),
            ("Count all shirts", "SELECT COUNT(*) FROM finished_goods WHERE LOWER(category)='shirt';"),
            ("Average selling price of shirts", "SELECT AVG(selling_price) FROM finished_goods WHERE LOWER(category)='shirt';"),
            ("Most expensive product", "SELECT * FROM finished_goods ORDER BY selling_price DESC LIMIT 1;"),
            ("Cheapest product", "SELECT * FROM finished_goods ORDER BY selling_price ASC LIMIT 1;"),
            ("Top 10 expensive products", "SELECT * FROM finished_goods ORDER BY selling_price DESC LIMIT 10;"),
            ("List all brands", "SELECT DISTINCT brand FROM finished_goods ORDER BY brand;"),
            ("List all categories", "SELECT DISTINCT category FROM finished_goods ORDER BY category;"),
            ("Show all buyers", "SELECT * FROM buyers;"),
            ("Show buyers from Canada", "SELECT * FROM buyers WHERE LOWER(country)='canada';"),
            ("Show all suppliers", "SELECT * FROM suppliers;"),
            ("Total revenue", "SELECT SUM(amount) as total_revenue FROM sales_invoices;"),
            ("Show unpaid invoices", "SELECT * FROM sales_invoices WHERE LOWER(payment_status)='unpaid';"),
            ("Show all orders", "SELECT * FROM sales_orders;"),
            ("Show pending orders", "SELECT * FROM sales_orders WHERE LOWER(status)='pending';"),
        ]
        
        for question, sql in examples:
            vn.train(question=question, sql=sql)

        # Verify training
        training_data = vn.get_training_data()
        ddl_count = len(training_data[training_data['training_data_type'] == 'ddl'])
        doc_count = len(training_data[training_data['training_data_type'] == 'documentation'])
        sql_count = len(training_data[training_data['training_data_type'] == 'sql'])
        
        print(f"Training complete: {ddl_count} DDL, {doc_count} docs, {sql_count} SQL examples")
        
        return jsonify({
            "success": True, 
            "message": "Vanna successfully trained on PostgreSQL schema.",
            "stats": {
                "ddl_entries": ddl_count,
                "documentation_entries": doc_count,
                "sql_examples": sql_count
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/nl2sql", methods=["POST"])
def nl2sql():
    data = request.json
    question = data.get("question")
    if not question:
        return jsonify({"success": False, "message": "Question is required"}), 400
    
    try:
        # Debug: check what Vanna retrieves before generating
        ddl_list = vn.get_related_ddl(question)
        doc_list = vn.get_related_documentation(question)
        sql_list = vn.get_similar_question_sql(question)
        
        print(f"\n--- Vanna Retrieval Debug for: '{question}' ---")
        print(f"  DDL entries retrieved: {len(ddl_list)}")
        print(f"  Documentation entries retrieved: {len(doc_list)}")
        print(f"  Similar SQL examples retrieved: {len(sql_list)}")
        if ddl_list:
            print(f"  First DDL: {ddl_list[0][:100]}...")
        if doc_list:
            print(f"  First Doc: {doc_list[0][:100]}...")
        if sql_list:
            print(f"  First SQL example: {json.dumps(sql_list[0])[:100]}...")
        print(f"--- End Retrieval Debug ---\n")
        
        # Normalize singular/plural variations
        import re
        norm_question = re.sub(r'\bshirts\b', 'shirt', question, flags=re.IGNORECASE)
        norm_question = re.sub(r'\bhoodies\b', 'hoodie', norm_question, flags=re.IGNORECASE)
        norm_question = re.sub(r'\bjackets\b', 'jacket', norm_question, flags=re.IGNORECASE)
        norm_question = re.sub(r'\btrousers\b', 'trouser', norm_question, flags=re.IGNORECASE)
        
        sql = vn.generate_sql(question=norm_question)
        
        print(f"\nGenerated SQL (Raw from Vanna):\n{sql}\n")
        
        # Cleanup markdown and extra text
        if "```sql" in sql:
            sql_match = re.search(r'```sql\n(.*?)\n```', sql, re.DOTALL | re.IGNORECASE)
            if sql_match:
                sql = sql_match.group(1).strip()
            else:
                sql = sql.replace("```sql", "").replace("```", "").strip()
        else:
            sql = sql.replace("```", "").strip()
            
        sql_match2 = re.search(r'(SELECT.*)', sql, re.DOTALL | re.IGNORECASE)
        if sql_match2:
            sql = sql_match2.group(1).strip()
            
        # Ensure it ends with a semicolon
        if not sql.endswith(';'):
            sql += ';'
            
        print(f"\nGenerated SQL (Extracted/Parsed):\n{sql}\n")
        
        if not sql.strip().upper().startswith("SELECT"):
            raise Exception("Failed to extract a valid SELECT statement from the response.")
            
        return jsonify({"success": True, "generatedSQL": sql})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.json
    question = data.get("question")
    rows = data.get("rows", [])
    
    try:
        if not openrouter_api_key:
            raise Exception("OPENROUTER_API_KEY is not set.")
            
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_api_key,
        )
        prompt = f"Summarize these database query results in 1-2 simple sentences.\nQuestion: {question}\nData: {json.dumps(rows[:3])}"
        response = client.chat.completions.create(
            model="openai/gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        
        return jsonify({"success": True, "summary": response.choices[0].message.content.strip()})
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
