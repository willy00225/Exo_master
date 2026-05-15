const Groq = require("groq-sdk");

const apiKey = process.env.GROQ_API_KEY;

let groq = null;

if (apiKey) {
  groq = new Groq({ apiKey });
  console.log("✅ Groq initialisé avec succès.");
} else {
  console.warn("⚠️ Aucune clé GROQ_API_KEY trouvée. L'IA ne fonctionnera pas.");
}

async function generateWithAI(prompt, systemInstruction = "Tu es un assistant pédagogique.") {
  if (!groq) {
    throw new Error("Clé Groq non configurée.");
  }

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
}

module.exports = { generateWithAI };