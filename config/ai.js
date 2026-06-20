const Groq = require("groq-sdk");
const OpenAI = require("openai");

// --- OpenAI (ChatGPT Pro) ---
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log("✅ OpenAI (ChatGPT Pro) configuré.");
}

// --- Groq (fallback gratuit) ---
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log("✅ Groq (fallback) configuré.");
}

async function generateWithAI(prompt, systemInstruction = "Tu es un assistant pédagogique.") {
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.error("Erreur OpenAI :", err.message);
      if (err.status === 429) throw err; // quota OpenAI dépassé → stop
      // Sinon on tente Groq
    }
  }

  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      });
      return completion.choices[0].message.content;
    } catch (err) {
      console.error("Erreur Groq :", err.message);
      throw err;
    }
  }

  throw new Error("Aucune IA configurée.");
}

module.exports = { generateWithAI };