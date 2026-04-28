const OpenAI = require("openai");
const pool = require("./db");

let openaiInstance = null;

async function getOpenAI() {
  if (openaiInstance) return openaiInstance;

  // Récupérer la clé depuis la table settings
  const result = await pool.query("SELECT value FROM settings WHERE key = 'openai_api_key'");
  const apiKey = result.rows[0]?.value || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Clé API OpenAI non configurée.");
  }

  openaiInstance = new OpenAI({ apiKey });
  return openaiInstance;
}

module.exports = { getOpenAI };