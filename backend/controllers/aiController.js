const { askAI, summarizeResult, getEmbedding, searchTypesense } = require("../services/aiService");
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

// AI Image Search (Multimodal and Text-based vector search)
const imageSearch = async (req, res) => {
  try {
    const { image, mimeType, q } = req.body;

    if (!image && !q) {
      return res.status(400).json({
        success: false,
        message: "Either image or text query is required for image search",
      });
    }

    // 1. Get embedding from Python service
    const embedding = await getEmbedding(image, q);

    // 2. Search Typesense
    const searchResults = await searchTypesense(embedding);

    res.json({
      success: true,
      tags: { keywords: q || "Visual Search" }, // Send mock tags so frontend doesn't break if it expects it
      data: searchResults,
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