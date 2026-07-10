const axios = require("axios");
const Typesense = require("typesense");
require("dotenv").config();

// Initialize Typesense Client
const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || "localhost",
      port: process.env.TYPESENSE_PORT || "8108",
      protocol: process.env.TYPESENSE_PROTOCOL || "http",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || "xyz",
  connectionTimeoutSeconds: 2,
});

// 👇 PUT IT HERE
(async () => {
  try {
    const collections = await typesenseClient.collections().retrieve();

    console.log("Collections:");
    
  } catch (err) {
    console.error("Collections Error:");
    console.error(err);
  }
})();

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:5000";

async function askAI(question) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/nl2sql`, { question });
    return response.data.generatedSQL;
  } catch (err) {
    console.error("Vanna AI Error:", err.response?.data || err.message);
    const errorDetails = err.response?.data?.message || err.message;
    throw new Error(`Failed to generate SQL from Natural Language: ${errorDetails}`);
  }
}

async function summarizeResult(question, rows) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/summarize`, { question, rows });
    return response.data.summary;
  } catch (err) {
    console.error("Summarizer Error:", err.response?.data || err.message);
    return `Found ${rows.length} results.`;
  }
}

async function getEmbedding(image, text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/embed`, { 
        text: text 
    });
    return response.data.embedding;
  } catch (err) {
  

  console.error("Message:", err.message);

  if (err.response) {
    console.error("Status:", err.response.status);
    console.error("Data:", err.response.data);
  }

  console.error(err);

  throw new Error("Failed to generate embedding");
}
}

async function searchTypesense(embedding) {
  // TEMPORARY TEST
  const result = await typesenseClient
    .collections("products")
    .documents()
    .search({
      q: "blue",
      query_by: "style_name,color,category"
    });

  console.log("Typesense Search Result:");
  console.log(JSON.stringify(result, null, 2));

  return result.hits.map(hit => hit.document);
}




module.exports = {
  askAI,
  summarizeResult,
  getEmbedding,
  searchTypesense,
  typesenseClient
};
