const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('./db');

let geminiClient = null;

/**
 * Initialise et retourne le client Gemini (singleton).
 * Récupère la clé API depuis la variable d'environnement `GEMINI_API_KEY` ou la table `settings`.
 */
const getGemini = async () => {
  if (geminiClient) return geminiClient;

  // Récupère la clé depuis la variable d'environnement ou la table settings
  const result = await pool.query("SELECT value FROM settings WHERE key = 'gemini_api_key'");
  const apiKey = process.env.GEMINI_API_KEY || result.rows[0]?.value;

  if (!apiKey) {
    console.warn('Aucune clé API Gemini trouvée.');
    return null;
  }

  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
};

/**
 * Appelle Gemini pour générer du contenu et retourne la réponse textuelle.
 * @param {string} prompt - Le prompt utilisateur.
 * @param {string} [systemInstruction] - Instruction système optionnelle.
 * @returns {Promise<string>} - Le texte généré par le modèle.
 */
async function generateWithGemini(prompt, systemInstruction) {
  const genAI = await getGemini();
  if (!genAI) throw new Error('Clé Gemini manquante');

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemInstruction || 'Tu es un assistant pédagogique qui répond uniquement en JSON valide.',
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}

module.exports = { generateWithGemini };