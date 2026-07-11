import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Import routers
from app.api import buyers, suppliers, products, orders, invoices, dashboard, ai

app = FastAPI(title="WFX API", description="Unified FastAPI Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend domains
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(buyers.router, prefix="/api/buyers", tags=["buyers"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"])
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"])
app.include_router(ai.router, prefix="/api", tags=["ai"])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "WFX FastAPI Backend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
