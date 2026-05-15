const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log("✅ Gemini initialisé avec succès.");
} else {
  console.warn("⚠️ Aucune clé GEMINI_API_KEY trouvée. L'IA ne fonctionnera pas.");
}

/**
 * Génère du contenu avec Gemini.
 * @param {string} prompt - Le prompt utilisateur.
 * @param {string} systemInstruction - Instruction système (optionnel).
 * @returns {string} Le texte généré.
 */
async function generateWithGemini(prompt, systemInstruction = "Tu es un assistant pédagogique.") {
  if (!genAI) {
    throw new Error("Clé Gemini non configurée.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

module.exports = { generateWithGemini };