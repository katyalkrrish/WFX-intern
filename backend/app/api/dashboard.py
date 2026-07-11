from fastapi import APIRouter, HTTPException
from app.database.db import execute_query

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats():
    try:
        counts = execute_query("""
            SELECT 
                (SELECT COUNT(*) FROM buyers) as buyers_count,
                (SELECT COUNT(*) FROM suppliers) as suppliers_count,
                (SELECT COUNT(*) FROM finished_goods) as products_count,
                (SELECT COUNT(*) FROM sales_orders) as orders_count,
                (SELECT COUNT(*) FROM sales_invoices) as invoices_count
        """, fetch_one=True)
        
        revenue = execute_query("SELECT SUM(amount) as total_revenue FROM sales_invoices", fetch_one=True)
        order_status = execute_query("SELECT status, COUNT(*) as count FROM sales_orders GROUP BY status")
        payment_status = execute_query("SELECT payment_status, COUNT(*) as count, SUM(amount) as total_amount FROM sales_invoices GROUP BY payment_status")

        return {
            "success": True,
            "buyers": int(counts['buyers_count'] or 0),
            "suppliers": int(counts['suppliers_count'] or 0),
            "products": int(counts['products_count'] or 0),
            "orders": int(counts['orders_count'] or 0),
            "invoices": int(counts['invoices_count'] or 0),
            "totalRevenue": float(revenue['total_revenue'] or 0),
            "orderStatusDistribution": [
                {"status": row['status'], "count": int(row['count'])} for row in order_status
            ],
            "paymentStatusDistribution": [
                {"status": row['payment_status'], "count": int(row['count']), "amount": float(row['total_amount'] or 0)} for row in payment_status
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
