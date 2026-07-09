import os
import psycopg2
import typesense
import requests
from io import BytesIO
from PIL import Image
import torch
import open_clip

# Config
DB_URL = os.environ.get("DATABASE_URL")
TYPESENSE_HOST = os.environ.get("TYPESENSE_HOST", "localhost")
TYPESENSE_PORT = os.environ.get("TYPESENSE_PORT", "8108")
TYPESENSE_PROTOCOL = os.environ.get("TYPESENSE_PROTOCOL", "http")
TYPESENSE_API_KEY = os.environ.get("TYPESENSE_API_KEY", "xyz")

# Typesense Client
client = typesense.Client({
    'nodes': [{
        'host': TYPESENSE_HOST,
        'port': TYPESENSE_PORT,
        'protocol': TYPESENSE_PROTOCOL,
    }],
    'api_key': TYPESENSE_API_KEY,
    'connection_timeout_seconds': 2
})

# Load OpenCLIP
device = "cpu"
print("Loading OpenCLIP model for indexing...")
model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai', device=device)

def get_embedding(image_url):
    try:
        response = requests.get(image_url, timeout=5)
        if response.status_code == 200:
            img = Image.open(BytesIO(response.content)).convert("RGB")
            img_tensor = preprocess(img).unsqueeze(0).to(device)
            with torch.no_grad():
                features = model.encode_image(img_tensor)
                features /= features.norm(dim=-1, keepdim=True)
                return features.cpu().numpy()[0].tolist()
    except Exception as e:
        print(f"Error embedding {image_url}: {e}")
    return None

def main():
    if not DB_URL:
        print("DATABASE_URL environment variable is required.")
        return

    # 1. Fetch products
    print("Connecting to DB...")
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor()
    # 13 columns matching the exact PostgreSQL schema
    cursor.execute("""
        SELECT style_number, style_name, category, fabric, gsm, color, print, season, brand, supplier, cost, selling_price, image_url 
        FROM finished_goods
    """)
    products = cursor.fetchall()
    conn.close()

    # 2. Setup Typesense Collection
    schema = {
        "name": "products",
        "fields": [
            {"name": "style_number", "type": "string"},
            {"name": "style_name", "type": "string"},
            {"name": "category", "type": "string", "facet": True},
            {"name": "fabric", "type": "string", "facet": True},
            {"name": "gsm", "type": "int32", "optional": True},
            {"name": "color", "type": "string", "facet": True},
            {"name": "print", "type": "string"},
            {"name": "season", "type": "string", "optional": True},
            {"name": "brand", "type": "string"},
            {"name": "supplier", "type": "string", "optional": True},
            {"name": "cost", "type": "float", "optional": True},
            {"name": "selling_price", "type": "float", "optional": True},
            {"name": "image_url", "type": "string", "optional": True},
            {"name": "embedding", "type": "float[]", "num_dim": 512}
        ]
    }

    try:
        client.collections['products'].delete()
        print("Deleted existing collection.")
    except:
        pass

    client.collections.create(schema)
    print("Created Typesense collection.")

    # 3. Index Products
    documents = []
    for p in products:
        style_number, style_name, category, fabric, gsm, color, print_type, season, brand, supplier, cost, selling_price, image_url = p
        
        print(f"Processing {style_number}...")
        emb = None
        if image_url:
            emb = get_embedding(image_url)
            
        if not emb:
            print(f"Skipping {style_number} - no valid image embedding")
            continue
            
        doc = {
            "id": style_number,
            "style_number": style_number,
            "style_name": style_name or "",
            "category": category or "",
            "fabric": fabric or "",
            "gsm": gsm or 0,
            "color": color or "",
            "print": print_type or "",
            "season": season or "",
            "brand": brand or "",
            "supplier": supplier or "",
            "cost": float(cost) if cost else 0.0,
            "selling_price": float(selling_price) if selling_price else 0.0,
            "image_url": image_url or "",
            "embedding": emb
        }
        documents.append(doc)

    print(f"Indexing {len(documents)} products...")
    client.collections['products'].documents.import_(documents, {'action': 'upsert'})
    print("Indexing complete.")

if __name__ == "__main__":
    main()
