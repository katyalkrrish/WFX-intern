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

suppliers(
    supplier_id, -- TEXT, unique identifier
    company_name, -- TEXT, name of the supplier
    country, -- TEXT, country of the supplier
    contact, -- TEXT, email of the supplier
    lead_time_days, -- INTEGER, days to fulfill orders
    rating -- NUMERIC, rating of supplier
)

buyers(
    buyer_id, -- TEXT, unique identifier
    company_name, -- TEXT, name of the buyer company
    country, -- TEXT, country of the buyer
    buyer_category -- TEXT, category of buyer (e.g. 'Department Store', 'Boutique')
)

finished_goods(
    style_number, -- TEXT, primary key (e.g. 'WFX-2501')
    style_name, -- TEXT, name of the style
    category, -- TEXT, category (e.g. 'Shorts', 'Hoodies', 'Dress', 'Pants')
    fabric, -- TEXT, fabric description (e.g. 'Cotton Twill', 'Denim', 'Jersey')
    gsm, -- INTEGER, grams per square meter (fabric thickness)
    color, -- TEXT, color of the garment
    print, -- TEXT, pattern/print (e.g. 'Solid', 'Striped', 'Floral')
    season, -- TEXT, season code (e.g. 'AW26', 'SS26')
    brand, -- TEXT, brand name
    supplier, -- TEXT, supplier company_name (joins with suppliers.company_name)
    cost, -- NUMERIC, cost price
    selling_price, -- NUMERIC, selling price to buyers
    image_url -- TEXT, URL of the garment photo
)

sales_orders(
    order_number, -- TEXT, primary key (e.g. 'SO-00001')
    buyer, -- TEXT, buyer company_name (joins with buyers.company_name)
    style_number, -- TEXT, style number (joins with finished_goods.style_number)
    quantity, -- INTEGER, number of items ordered
    unit_price, -- NUMERIC, price per item
    shipment_date, -- DATE, shipment delivery date
    status -- TEXT, order status (e.g. 'Shipped', 'Processing', 'Pending')
)

sales_invoices(
    invoice_number, -- TEXT, primary key (e.g. 'INV-00001')
    sales_order, -- TEXT, order number (joins with sales_orders.order_number)
    amount, -- NUMERIC, invoice amount
    currency, -- TEXT, currency code (e.g. 'USD', 'EUR', 'GBP', 'INR')
    payment_status -- TEXT, invoice status (e.g. 'Paid', 'Partially Paid', 'Unpaid')
)

tech_packs(
    tech_pack_id, -- TEXT, primary key (e.g. 'TP-WFX-2501')
    style_number, -- TEXT, style number (joins with finished_goods.style_number)
    fabric_details, -- TEXT, details of the fabric
    construction, -- TEXT, weave/construction method
    wash_instructions -- TEXT, care and wash instructions
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

async function extractTagsFromImage(base64Image, mimeType = "image/jpeg") {
  try {
    console.log("Analyzing image with OpenRouter Vision...");
    const completion = await client.chat.completions.create({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert fashion catalog tagger. Analyze the uploaded image and extract the following descriptors as a single flat JSON object with these exact keys:
- category: A single string matching a product category (e.g. Shirts, Shorts, Hoodies, Pants, Dress, Jackets, Sweaters)
- fabric: A single string matching a fabric type (e.g. Denim, Cotton, Cotton Twill, Polyester, Jersey, Linen, Fleece, Wool)
- color: A single dominant color (e.g. Plum, Black, Blue, Navy, White, Grey, Red, Green, Orange, Pink, Purple, Yellow, Brown)
- print: Pattern description (e.g. Solid, Striped, Printed, Checked, Floral, Graphic, Camouflage, Heather)
- keywords: A string containing 2-3 extra search terms (e.g. summer, formal, casual, athletic)

Return ONLY the raw JSON object. Do not include markdown code block syntax. Output must start with { and end with }.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0
    });

    const content = completion.choices[0].message.content.trim();
    // Strip markdown JSON block backticks if LLM returns them anyway
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error("Image tagging error:", err);
    throw err;
  }
}

async function extractTagsFromText(textQuery) {
  try {
    console.log("Extracting tags from text query:", textQuery);
    const completion = await client.chat.completions.create({
      model: "openai/gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `Analyze the user search query and extract fashion catalog descriptors as a flat JSON object with the following keys. If a descriptor is not mentioned or cannot be inferred, return an empty string for that key:
- category: Product category (e.g. Shirts, Shorts, Hoodies, Pants, Dress, Jackets, Sweaters)
- fabric: Fabric type (e.g. Denim, Cotton, Cotton Twill, Polyester, Jersey, Linen, Fleece, Wool)
- color: Color (e.g. Plum, Black, Blue, Navy, White, Grey, Red, Green, Orange, Pink, Purple, Yellow, Brown)
- print: Pattern/print (e.g. Solid, Striped, Printed, Checked, Floral, Graphic, Camouflage, Heather)
- keywords: 1-2 descriptive keywords

Example: "blue striped denim jacket" -> {"category": "Jackets", "fabric": "Denim", "color": "Blue", "print": "Striped", "keywords": "denim jacket"}
Example: "comfy black hoodie for winter" -> {"category": "Hoodies", "fabric": "", "color": "Black", "print": "Solid", "keywords": "winter comfy"}

Return ONLY the raw JSON object. Do not include markdown code block syntax. Output must start with { and end with }.`
        },
        {
          role: "user",
          content: textQuery
        }
      ],
      temperature: 0
    });

    const content = completion.choices[0].message.content.trim();
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);

  } catch (err) {
    console.error("Text tag extraction error:", err);
    throw err;
  }
}

module.exports = {
  askAI,
  summarizeResult,
  extractTagsFromImage,
  extractTagsFromText
};

