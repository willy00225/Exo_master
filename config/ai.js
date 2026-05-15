const OpenAI = require("openai");

const apiKey = process.env.OPENROUTER_API_KEY;

let openai = null;

if (apiKey) {
  openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: apiKey,
    defaultHeaders: {
      "HTTP-Referer": process.env.SITE_URL || "https://exomaster.com",
      "X-Title": "Exo Master",
    },
  });
  console.log("✅ OpenRouter initialisé avec succès.");
} else {
  console.warn("⚠️ Aucune clé OPENROUTER_API_KEY trouvée. L'IA ne fonctionnera pas.");
}

async function generateWithAI(prompt, systemInstruction = "Tu es un assistant pédagogique.") {
  if (!openai) {
    throw new Error("Clé AI non configurée.");
  }

  const completion = await openai.chat.completions.create({
    model: "google/gemini-2.5-flash-exp:free",
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  return completion.choices[0].message.content;
}

module.exports = { generateWithAI };