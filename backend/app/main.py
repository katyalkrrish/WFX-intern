import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.auth import require_user

load_dotenv()

# Import routers
from app.api import buyers, suppliers, products, orders, invoices, dashboard, ai

app = FastAPI(title="WFX API", description="Unified FastAPI Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.environ.get("FRONTEND_ORIGINS", "http://localhost:5173").split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
protected = [Depends(require_user)]
app.include_router(buyers.router, prefix="/api/buyers", tags=["buyers"], dependencies=protected)
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["suppliers"], dependencies=protected)
app.include_router(products.router, prefix="/api/products", tags=["products"], dependencies=protected)
app.include_router(orders.router, prefix="/api/orders", tags=["orders"], dependencies=protected)
app.include_router(invoices.router, prefix="/api/invoices", tags=["invoices"], dependencies=protected)
app.include_router(dashboard.router, prefix="/api", tags=["dashboard"], dependencies=protected)
app.include_router(ai.router, prefix="/api", tags=["ai"], dependencies=protected)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "WFX FastAPI Backend"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
