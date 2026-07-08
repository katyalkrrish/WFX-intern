const pool = require("../config/db");

// Get all products (legacy, kept for compatibility)
const getProducts = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM finished_goods ORDER BY style_number ASC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Search products with dynamic filtering, sorting and pagination
const searchProducts = async (req, res) => {
  try {
    const {
      q,
      category,
      fabric,
      color,
      print,
      season,
      supplier,
      gsm_min,
      gsm_max,
      price_min,
      price_max,
      sort,
      order,
      page = 1,
      limit = 12
    } = req.query;

    let queryStr = `SELECT * FROM finished_goods WHERE 1=1`;
    const queryParams = [];
    let paramIndex = 1;

    if (q) {
      queryStr += ` AND (style_name ILIKE $${paramIndex} OR style_number ILIKE $${paramIndex} OR brand ILIKE $${paramIndex} OR supplier ILIKE $${paramIndex} OR fabric ILIKE $${paramIndex})`;
      queryParams.push(`%${q}%`);
      paramIndex++;
    }

    if (category) {
      queryStr += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (fabric) {
      queryStr += ` AND fabric = $${paramIndex}`;
      queryParams.push(fabric);
      paramIndex++;
    }

    if (color) {
      queryStr += ` AND color = $${paramIndex}`;
      queryParams.push(color);
      paramIndex++;
    }

    if (print) {
      queryStr += ` AND print = $${paramIndex}`;
      queryParams.push(print);
      paramIndex++;
    }

    if (season) {
      queryStr += ` AND season = $${paramIndex}`;
      queryParams.push(season);
      paramIndex++;
    }

    if (supplier) {
      queryStr += ` AND supplier = $${paramIndex}`;
      queryParams.push(supplier);
      paramIndex++;
    }

    if (gsm_min) {
      queryStr += ` AND gsm >= $${paramIndex}`;
      queryParams.push(parseInt(gsm_min));
      paramIndex++;
    }

    if (gsm_max) {
      queryStr += ` AND gsm <= $${paramIndex}`;
      queryParams.push(parseInt(gsm_max));
      paramIndex++;
    }

    if (price_min) {
      queryStr += ` AND selling_price >= $${paramIndex}`;
      queryParams.push(parseFloat(price_min));
      paramIndex++;
    }

    if (price_max) {
      queryStr += ` AND selling_price <= $${paramIndex}`;
      queryParams.push(parseFloat(price_max));
      paramIndex++;
    }

    // Get total count for pagination before applying LIMIT/OFFSET
    const countQueryStr = queryStr.replace("SELECT *", "SELECT COUNT(*)");
    const countRes = await pool.query(countQueryStr, queryParams);
    const totalItems = parseInt(countRes.rows[0].count);

    // Sorting
    const allowedSortFields = ["selling_price", "gsm", "style_number", "style_name", "cost"];
    const sortField = allowedSortFields.includes(sort) ? sort : "style_number";
    const sortOrder = order === "desc" ? "DESC" : "ASC";
    queryStr += ` ORDER BY ${sortField} ${sortOrder}`;

    // Pagination
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const offset = (parsedPage - 1) * parsedLimit;
    
    queryStr += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parsedLimit, offset);

    const result = await pool.query(queryStr, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get unique filter values from database to dynamically build filters in frontend UI
const getProductFilters = async (req, res) => {
  try {
    const [
      categoriesRes,
      fabricsRes,
      colorsRes,
      printsRes,
      seasonsRes,
      suppliersRes,
      rangesRes
    ] = await Promise.all([
      pool.query("SELECT DISTINCT category FROM finished_goods WHERE category IS NOT NULL ORDER BY category"),
      pool.query("SELECT DISTINCT fabric FROM finished_goods WHERE fabric IS NOT NULL ORDER BY fabric"),
      pool.query("SELECT DISTINCT color FROM finished_goods WHERE color IS NOT NULL ORDER BY color"),
      pool.query("SELECT DISTINCT print FROM finished_goods WHERE print IS NOT NULL ORDER BY print"),
      pool.query("SELECT DISTINCT season FROM finished_goods WHERE season IS NOT NULL ORDER BY season"),
      pool.query("SELECT DISTINCT supplier FROM finished_goods WHERE supplier IS NOT NULL ORDER BY supplier"),
      pool.query("SELECT MIN(gsm) as min_gsm, MAX(gsm) as max_gsm, MIN(selling_price) as min_price, MAX(selling_price) as max_price FROM finished_goods")
    ]);

    res.json({
      success: true,
      categories: categoriesRes.rows.map(r => r.category),
      fabrics: fabricsRes.rows.map(r => r.fabric),
      colors: colorsRes.rows.map(r => r.color),
      prints: printsRes.rows.map(r => r.print),
      seasons: seasonsRes.rows.map(r => r.season),
      suppliers: suppliersRes.rows.map(r => r.supplier),
      ranges: {
        minGsm: rangesRes.rows[0].min_gsm || 0,
        maxGsm: rangesRes.rows[0].max_gsm || 500,
        minPrice: parseFloat(rangesRes.rows[0].min_price || 0),
        maxPrice: parseFloat(rangesRes.rows[0].max_price || 10000)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get product details along with tech pack by style number
const getProductDetails = async (req, res) => {
  try {
    const { styleNumber } = req.params;
    
    const productQuery = pool.query("SELECT * FROM finished_goods WHERE style_number = $1", [styleNumber]);
    const techPackQuery = pool.query("SELECT * FROM tech_packs WHERE style_number = $1", [styleNumber]);

    const [productRes, techPackRes] = await Promise.all([productQuery, techPackQuery]);

    if (productRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product: productRes.rows[0],
      techPack: techPackRes.rows[0] || null
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = {
  getProducts,
  searchProducts,
  getProductFilters,
  getProductDetails
};