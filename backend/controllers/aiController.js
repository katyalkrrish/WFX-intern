const { askAI, summarizeResult } = require("../services/openRouterService");
const pool = require("../config/db");

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

module.exports = {
  askQuestion,
};