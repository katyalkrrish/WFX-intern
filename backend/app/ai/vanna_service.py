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

                or_token = os.environ.get("OPENROUTER_API_KEY")
                ef = None
                if or_token:
                    print("Using OpenRouter API for embeddings to completely bypass Hugging Face DNS issues!")
                    import requests
                    from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
                    
                    class OpenRouterEmbeddingFunction(EmbeddingFunction):
                        def __init__(self, api_key: str):
                            self.api_url = "https://openrouter.ai/api/v1/embeddings"
                            self.headers = {"Authorization": f"Bearer {api_key}"}

                        def __call__(self, input: Documents) -> Embeddings:
                            try:
                                response = requests.post(self.api_url, headers=self.headers, json={
                                    "model": "openai/text-embedding-3-small",
                                    "input": input
                                }, timeout=60)
                                if response.status_code == 200:
                                    return [data["embedding"] for data in response.json()["data"]]
                                else:
                                    print("OpenRouter API Error:", response.text)
                                    # Fallback to zeros if it fails so it doesn't crash Chroma
                                    return [[0.0] * 1536 for _ in input]
                            except Exception as e:
                                print(f"OpenRouter API Exception: {e}")
                                return [[0.0] * 1536 for _ in input]

                    ef = OpenRouterEmbeddingFunction(api_key=or_token)
                else:
                    print("WARNING: OPENROUTER_API_KEY not set. Falling back to local ONNX (may OOM on Render).")

                _vn_instance = SimplifiedVanna(config={
                    "api_key": openrouter_api_key,
                    "model": "openai/gpt-4o-mini",
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

        # Examples removed to prevent 60s sequential timeout on initial boot.
        # DDL and documentation is sufficient for gpt-4o-mini to generate correct SQL.

        print("Auto-train complete.")
    except Exception as exc:
        print("Auto-train failed:", exc)

def _auto_train_if_empty():
    try:
        vn = get_vn()
        td = vn.get_training_data()
        if td is None or len(td) == 0:
            print("Starting synchronous auto-train...")
            _do_train()
        else:
            print(f"ChromaDB already has {len(td)} training rows — skipping auto-train.")
    except Exception as exc:
        print("Could not check training data:", exc)

# Remove automatic call on import to save memory
# _auto_train_if_empty()

def generate_sql(question: str) -> str:
    vn = get_vn()
    # Trigger auto-train on first use if needed
    _auto_train_if_empty()
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
            model="openai/gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Summarizer error:", e)
        return f"Found {len(rows)} results for your question."
