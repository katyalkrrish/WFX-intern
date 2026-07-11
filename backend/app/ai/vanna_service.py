import os
import json
import threading
import openai
from app.database.db import get_db_connection, release_db_connection

openrouter_api_key = os.environ.get("OPENROUTER_API_KEY")
if not openrouter_api_key:
    print("WARNING: OPENROUTER_API_KEY is not set. Vanna SQL generation will fail.")

_vn_instance = None
_vn_lock = threading.Lock()

def get_vn():
    global _vn_instance
    if _vn_instance is None:
        with _vn_lock:
            if _vn_instance is None:
                print("Lazy loading Vanna and ChromaDB to save memory on startup...")
                
                from vanna.chromadb import ChromaDB_VectorStore
                from vanna.openai import OpenAI_Chat
                from chromadb.utils import embedding_functions
                
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
                            print(f"\\nSQL Prompt (OpenAI Format):\\n{json.dumps(prompt, indent=2)}\\n")
                            response = self.or_client.chat.completions.create(
                                model=self.model_name,
                                messages=prompt,
                                temperature=self.temperature
                            )
                            text = response.choices[0].message.content
                            print(f"\\nLLM Response:\\n{text}\\n")
                            return text
                        else:
                            return super().submit_prompt(prompt, **kwargs)

                hf_token = os.environ.get("HF_TOKEN")
                ef = None
                if hf_token:
                    print("Using HuggingFace API for embeddings (via requests) to save memory!")
                    import requests
                    from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
                    
                    class RequestsHuggingFaceEmbeddingFunction(EmbeddingFunction):
                        def __init__(self, api_key: str):
                            self.api_url = "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2"
                            self.headers = {"Authorization": f"Bearer {api_key}"}

                        def __call__(self, input: Documents) -> Embeddings:
                            try:
                                response = requests.post(self.api_url, headers=self.headers, json={"inputs": input}, timeout=30)
                                if response.status_code == 200:
                                    return response.json()
                                else:
                                    print("HF API Error:", response.text)
                                    return [[] for _ in input]
                            except Exception as e:
                                print(f"HF API Exception: {e}")
                                return [[] for _ in input]

                    ef = RequestsHuggingFaceEmbeddingFunction(api_key=hf_token)
                else:
                    print("WARNING: HF_TOKEN not set. Falling back to local ONNX (may OOM on Render).")

                _vn_instance = SimplifiedVanna(config={
                    "api_key": openrouter_api_key,
                    "model": "openai/gpt-4.1-mini",
                    "path": "./vanna_chroma_db_v2",
                    "embedding_function": ef
                })
    return _vn_instance

def _do_train():
    try:
        print("Auto-training Vanna (ChromaDB was empty)...")
        conn = get_db_connection()
        cursor = conn.cursor()

        tables = ["buyers", "suppliers", "finished_goods", "sales_orders", "sales_invoices"]
        for table in tables:
            cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            columns = cursor.fetchall()
            ddl_str = f"CREATE TABLE {table} (" + ", ".join(f"{c[0]} {c[1]}" for c in columns) + ");"
            vn = get_vn()
            vn.train(ddl=ddl_str)

        release_db_connection(conn)

        vn = get_vn()
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

        vn = get_vn()
        vn.train(documentation="The buyers table contains customer information with columns: buyer_id, company_name, country, buyer_category.")
        vn.train(documentation="The suppliers table contains vendor information with columns: supplier_id, company_name, country, contact, lead_time_days, rating.")
        vn.train(documentation="The sales_orders table links buyers to finished_goods with columns: order_number, buyer, style_number, quantity, unit_price, shipment_date, status.")
        vn.train(documentation="The sales_invoices table links to sales_orders for payment tracking with columns: invoice_number, sales_order, amount, currency, payment_status.")

        examples = [
            ("Show all blue shirts",           "SELECT * FROM finished_goods WHERE LOWER(category)='shirt' AND LOWER(color)='blue';"),
            ("Show blue striped shirts",        "SELECT * FROM finished_goods WHERE LOWER(category)='shirt' AND LOWER(color)='blue' AND LOWER(print)='striped';"),
            ("Show all hoodies",               "SELECT * FROM finished_goods WHERE LOWER(category)='hoodie';"),
            ("Show black hoodies",             "SELECT * FROM finished_goods WHERE LOWER(category)='hoodie' AND LOWER(color)='black';"),
            ("Show denim products",            "SELECT * FROM finished_goods WHERE LOWER(fabric)='denim';"),
            ("Show cotton shirts",             "SELECT * FROM finished_goods WHERE LOWER(category)='shirt' AND LOWER(fabric)='cotton';"),
            ("Show products under 1000",       "SELECT * FROM finished_goods WHERE selling_price < 1000;"),
            ("Show products above 3000",       "SELECT * FROM finished_goods WHERE selling_price > 3000;"),
            ("Show Nike products",             "SELECT * FROM finished_goods WHERE LOWER(brand)='nike';"),
            ("Show Adidas hoodies",            "SELECT * FROM finished_goods WHERE LOWER(brand)='adidas' AND LOWER(category)='hoodie';"),
            ("Show summer collection",         "SELECT * FROM finished_goods WHERE LOWER(season)='summer';"),
            ("Show winter jackets",            "SELECT * FROM finished_goods WHERE LOWER(category)='jacket' AND LOWER(season)='winter';"),
            ("Show products supplied by ABC Textiles", "SELECT * FROM finished_goods WHERE supplier ILIKE '%ABC Textiles%';"),
            ("Count all shirts",               "SELECT COUNT(*) FROM finished_goods WHERE LOWER(category)='shirt';"),
            ("Average selling price of shirts","SELECT AVG(selling_price) FROM finished_goods WHERE LOWER(category)='shirt';"),
            ("Most expensive product",         "SELECT * FROM finished_goods ORDER BY selling_price DESC LIMIT 1;"),
            ("Cheapest product",               "SELECT * FROM finished_goods ORDER BY selling_price ASC LIMIT 1;"),
            ("Top 10 expensive products",      "SELECT * FROM finished_goods ORDER BY selling_price DESC LIMIT 10;"),
            ("List all brands",                "SELECT DISTINCT brand FROM finished_goods ORDER BY brand;"),
            ("List all categories",            "SELECT DISTINCT category FROM finished_goods ORDER BY category;"),
            ("Show all buyers",                "SELECT * FROM buyers;"),
            ("Show buyers from Canada",        "SELECT * FROM buyers WHERE LOWER(country)='canada';"),
            ("Show all suppliers",             "SELECT * FROM suppliers;"),
            ("Total revenue",                  "SELECT SUM(amount) as total_revenue FROM sales_invoices;"),
            ("Show unpaid invoices",           "SELECT * FROM sales_invoices WHERE LOWER(payment_status)='unpaid';"),
            ("Show all orders",                "SELECT * FROM sales_orders;"),
            ("Show pending orders",            "SELECT * FROM sales_orders WHERE LOWER(status)='pending';"),
        ]
        vn = get_vn()
        for question, sql in examples:
            vn.train(question=question, sql=sql)

        print("Auto-train complete.")
    except Exception as exc:
        print("Auto-train failed:", exc)

def _auto_train_if_empty():
    try:
        vn = get_vn()
        td = vn.get_training_data()
        if td is None or len(td) == 0:
            t = threading.Thread(target=_do_train, daemon=True)
            t.start()
        else:
            print(f"ChromaDB already has {len(td)} training rows — skipping auto-train.")
    except Exception as exc:
        print("Could not check training data:", exc)

# Remove automatic call on import to save memory
# _auto_train_if_empty()

def generate_sql(question: str) -> str:
    vn = get_vn()
    # Trigger auto-train on first use if needed
    t = threading.Thread(target=_auto_train_if_empty, daemon=True)
    t.start()
    return vn.generate_sql(question=question)

def summarize_results(question: str, rows: list) -> str:
    if not openrouter_api_key:
        return f"Found {len(rows)} results for your question."
    try:
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_api_key,
        )
        prompt = (
            f"Summarize these database query results in 1-2 simple sentences.\n"
            f"Question: {question}\nData: {json.dumps(rows[:3], default=str)}"
        )
        response = client.chat.completions.create(
            model="openai/gpt-4.1-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Summarizer error:", e)
        return f"Found {len(rows)} results for your question."
