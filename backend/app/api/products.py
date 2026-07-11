from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import math
from app.database.db import execute_query

router = APIRouter()

@router.get("/")
def get_products():
    try:
        rows = execute_query("SELECT * FROM finished_goods ORDER BY style_number ASC")
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters")
def get_product_filters():
    try:
        categories = execute_query("SELECT DISTINCT category FROM finished_goods WHERE category IS NOT NULL ORDER BY category")
        fabrics = execute_query("SELECT DISTINCT fabric FROM finished_goods WHERE fabric IS NOT NULL ORDER BY fabric")
        colors = execute_query("SELECT DISTINCT color FROM finished_goods WHERE color IS NOT NULL ORDER BY color")
        prints = execute_query("SELECT DISTINCT print FROM finished_goods WHERE print IS NOT NULL ORDER BY print")
        seasons = execute_query("SELECT DISTINCT season FROM finished_goods WHERE season IS NOT NULL ORDER BY season")
        suppliers = execute_query("SELECT DISTINCT supplier FROM finished_goods WHERE supplier IS NOT NULL ORDER BY supplier")
        ranges = execute_query("SELECT MIN(gsm) as min_gsm, MAX(gsm) as max_gsm, MIN(selling_price) as min_price, MAX(selling_price) as max_price FROM finished_goods", fetch_one=True)

        return {
            "success": True,
            "categories": [r['category'] for r in categories],
            "fabrics": [r['fabric'] for r in fabrics],
            "colors": [r['color'] for r in colors],
            "prints": [r['print'] for r in prints],
            "seasons": [r['season'] for r in seasons],
            "suppliers": [r['supplier'] for r in suppliers],
            "ranges": {
                "minGsm": ranges['min_gsm'] if ranges and ranges['min_gsm'] is not None else 0,
                "maxGsm": ranges['max_gsm'] if ranges and ranges['max_gsm'] is not None else 500,
                "minPrice": float(ranges['min_price']) if ranges and ranges['min_price'] is not None else 0.0,
                "maxPrice": float(ranges['max_price']) if ranges and ranges['max_price'] is not None else 10000.0
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search")
def search_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    fabric: Optional[str] = None,
    color: Optional[str] = None,
    print_type: Optional[str] = Query(None, alias="print"),
    season: Optional[str] = None,
    supplier: Optional[str] = None,
    gsm_min: Optional[int] = None,
    gsm_max: Optional[int] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    sort: Optional[str] = "style_number",
    order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 12
):
    try:
        query_str = "SELECT * FROM finished_goods WHERE 1=1"
        query_params = []
        param_index = 1

        if q:
            query_str += f" AND (style_name ILIKE ${param_index} OR style_number ILIKE ${param_index} OR brand ILIKE ${param_index} OR supplier ILIKE ${param_index} OR fabric ILIKE ${param_index})"
            query_params.append(f"%{q}%")
            param_index += 1

        if category:
            query_str += f" AND category = ${param_index}"
            query_params.append(category)
            param_index += 1

        if fabric:
            query_str += f" AND fabric = ${param_index}"
            query_params.append(fabric)
            param_index += 1

        if color:
            query_str += f" AND color = ${param_index}"
            query_params.append(color)
            param_index += 1

        if print_type:
            query_str += f" AND print = ${param_index}"
            query_params.append(print_type)
            param_index += 1

        if season:
            query_str += f" AND season = ${param_index}"
            query_params.append(season)
            param_index += 1

        if supplier:
            query_str += f" AND supplier = ${param_index}"
            query_params.append(supplier)
            param_index += 1

        if gsm_min is not None:
            query_str += f" AND gsm >= ${param_index}"
            query_params.append(gsm_min)
            param_index += 1

        if gsm_max is not None:
            query_str += f" AND gsm <= ${param_index}"
            query_params.append(gsm_max)
            param_index += 1

        if price_min is not None:
            query_str += f" AND selling_price >= ${param_index}"
            query_params.append(price_min)
            param_index += 1

        if price_max is not None:
            query_str += f" AND selling_price <= ${param_index}"
            query_params.append(price_max)
            param_index += 1

        # Replace numbered placeholders ($1, $2) with %s for psycopg2
        import re
        psycopg2_query_str = re.sub(r'\$\d+', '%s', query_str)
        count_query_str = psycopg2_query_str.replace("SELECT *", "SELECT COUNT(*)")
        
        count_res = execute_query(count_query_str, tuple(query_params), fetch_one=True)
        total_items = count_res['count'] if count_res else 0

        allowed_sort_fields = ["selling_price", "gsm", "style_number", "style_name", "cost"]
        sort_field = sort if sort in allowed_sort_fields else "style_number"
        sort_order = "DESC" if order == "desc" else "ASC"
        
        psycopg2_query_str += f" ORDER BY {sort_field} {sort_order}"

        offset = (page - 1) * limit
        psycopg2_query_str += f" LIMIT %s OFFSET %s"
        query_params.extend([limit, offset])

        rows = execute_query(psycopg2_query_str, tuple(query_params))

        return {
            "success": True,
            "data": rows,
            "pagination": {
                "totalItems": total_items,
                "totalPages": math.ceil(total_items / limit) if total_items > 0 else 1,
                "currentPage": page,
                "limit": limit
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{style_number}")
def get_product_details(style_number: str):
    try:
        product = execute_query("SELECT * FROM finished_goods WHERE style_number = %s", (style_number,), fetch_one=True)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
            
        tech_pack = execute_query("SELECT * FROM tech_packs WHERE style_number = %s", (style_number,), fetch_one=True)
        
        return {
            "success": True,
            "product": product,
            "techPack": tech_pack
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
