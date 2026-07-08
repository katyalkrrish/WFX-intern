const OpenAI = require("openai");
require("dotenv").config();

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "WFX ERP AI",
  },
  timeout: 60000,
});

async function askAI(question) {
  try {
    console.log("Sending request to OpenRouter...");

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4.1-mini",

      messages: [
        {
          role: "system",
          content: `
You are an expert PostgreSQL SQL generator for an ERP system.

The database contains the following tables:

buyers(
    buyer_id,
    company_name, 
    country,
    buyer_category
)

suppliers(
    supplier_id,
    company_name,
    country,
    supplier_category
)

finished_goods(
    product_id,
    style_name,
    category,
    color,
    fabric,
    gsm,
    supplier_id,
    buyer_id,
    selling_price
)

sales_orders(
    order_id,
    buyer_id,
    product_id,
    quantity,
    order_date
)

sales_invoices(
    invoice_id,
    order_id,
    amount,
    invoice_date
)

Rules:

1. Return ONLY SQL.
2. Do NOT explain anything.
3. Do NOT use markdown.
4. Do NOT use \`\`\`.
5. Use PostgreSQL syntax.
6. Generate only SELECT queries.
7. If the question cannot be answered, return:

SELECT 'Cannot answer with available data';
          `,
        },
        {
          role: "user",
          content: question,
        },
      ],

      temperature: 0,
    });

    console.log("Response received");

    return completion.choices[0].message.content.trim();

  } catch (err) {
    console.error("OpenRouter Error:", err);
    throw err;
  }
}
async function summarizeResult(question, rows) {
  const completion = await client.chat.completions.create({
    model: "openai/gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content:
          "Summarize database query results in 1-2 simple sentences.",
      },
      {
        role: "user",
        content: `
Question:
${question}

Result:
${JSON.stringify(rows)}
        `,
      },
    ],
    temperature: 0,
  });

  return completion.choices[0].message.content.trim();
}

module.exports = {
  askAI,
  summarizeResult,
};

