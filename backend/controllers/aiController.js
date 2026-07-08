const { askAI, summarizeResult, extractTagsFromImage, extractTagsFromText } = require("../services/openRouterService");
const pool = require("../config/db");

// NL to SQL query execution
const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // Generate SQL
    const generatedSQL = await askAI(question);

    // Safety check
    if (!generatedSQL.trim().toUpperCase().startsWith("SELECT")) {
      return res.status(400).json({
        success: false,
        message: "Only SELECT queries are allowed.",
        generatedSQL,
      });
    }

    // Execute SQL
    const result = await pool.query(generatedSQL);

    // Generate AI summary
    const summary = await summarizeResult(question, result.rows);

    // Return response
    res.json({
      success: true,
      question,
      generatedSQL,
      rows: result.rows,
      summary,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// AI Image Search (Multimodal and Text-based tag matching)
const imageSearch = async (req, res) => {
  try {
    const { image, mimeType, q } = req.body;

    if (!image && !q) {
      return res.status(400).json({
        success: false,
        message: "Either image or text query is required for image search",
      });
    }

    let tags = {};
    if (image) {
      tags = await extractTagsFromImage(image, mimeType || "image/jpeg");
    } else {
      tags = await extractTagsFromText(q);
    }

    console.log("Extracted search tags:", tags);

    // Construct dynamic weighted SQL query based on tags
    let queryStr = `SELECT *, (0`;
    const queryParams = [];
    let paramIndex = 1;
    const whereClauses = [];

    if (tags.category) {
      queryStr += ` + CASE WHEN category ILIKE $${paramIndex} THEN 4 ELSE 0 END`;
      whereClauses.push(`category ILIKE $${paramIndex}`);
      queryParams.push(`%${tags.category}%`);
      paramIndex++;
    }

    if (tags.fabric) {
      queryStr += ` + CASE WHEN fabric ILIKE $${paramIndex} THEN 3 ELSE 0 END`;
      whereClauses.push(`fabric ILIKE $${paramIndex}`);
      queryParams.push(`%${tags.fabric}%`);
      paramIndex++;
    }

    if (tags.color) {
      queryStr += ` + CASE WHEN color ILIKE $${paramIndex} THEN 3 ELSE 0 END`;
      whereClauses.push(`color ILIKE $${paramIndex}`);
      queryParams.push(`%${tags.color}%`);
      paramIndex++;
    }

    if (tags.print) {
      queryStr += ` + CASE WHEN print ILIKE $${paramIndex} THEN 2 ELSE 0 END`;
      whereClauses.push(`print ILIKE $${paramIndex}`);
      queryParams.push(`%${tags.print}%`);
      paramIndex++;
    }

    if (tags.keywords) {
      queryStr += ` + CASE WHEN (style_name ILIKE $${paramIndex} OR brand ILIKE $${paramIndex} OR supplier ILIKE $${paramIndex} OR category ILIKE $${paramIndex}) THEN 2 ELSE 0 END`;
      whereClauses.push(`(style_name ILIKE $${paramIndex} OR brand ILIKE $${paramIndex} OR supplier ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
      queryParams.push(`%${tags.keywords}%`);
      paramIndex++;
    }

    queryStr += `) as match_score FROM finished_goods`;

    if (whereClauses.length > 0) {
      queryStr += ` WHERE ` + whereClauses.join(" OR ");
      queryStr += ` ORDER BY match_score DESC LIMIT 12`;
    } else {
      queryStr += ` ORDER BY style_number ASC LIMIT 12`;
    }

    const result = await pool.query(queryStr, queryParams);

    res.json({
      success: true,
      tags,
      data: result.rows,
    });

  } catch (err) {
    console.error("AI Image Search Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  askQuestion,
  imageSearch,
};