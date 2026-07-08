require("dotenv").config();

async function test() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "WFX ERP AI"
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: "Hello"
          }
        ]
      })
    });

    console.log("Status:", response.status);

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error(err);
  }
}

test();