const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { getOpenAI } = require("../config/openai");

router.use(auth);
router.use(admin);

// POST /api/ai/generate-questions (existante)
router.post("/generate-questions", async (req, res) => {
  // ... (code existant inchangé)
});

// ------------------------------
// NOUVEAU : Génération d'exercice complet (énoncé + corrigé)
// ------------------------------
router.post("/generate-exercise", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty, theme } = req.body;

    // Récupérer les infos du groupe et chapitre
    const group = await pool.query(
      "SELECT name, subject, level FROM groups WHERE id = $1",
      [group_id]
    );
    if (group.rows.length === 0) {
      return res.status(404).json({ error: "Groupe non trouvé." });
    }

    let chapterTitle = "général";
    if (chapter_id) {
      const chapter = await pool.query(
        "SELECT title FROM chapters WHERE id = $1",
        [chapter_id]
      );
      if (chapter.rows.length > 0) {
        chapterTitle = chapter.rows[0].title;
      }
    }

    const subject = group.rows[0].subject;
    const level = group.rows[0].level;

    // Construire le prompt
    const prompt = `
Tu es un professeur expert en ${subject} pour des élèves de niveau ${level}.
Génère un exercice complet pour le chapitre "${chapterTitle}".
Difficulté demandée : ${difficulty}.
${theme ? `Thème spécifique : ${theme}.` : ''}

L'exercice doit être adapté au niveau et comporter :
- Un énoncé clair et détaillé (éventuellement avec des sous-questions).
- Un corrigé complet avec explications étape par étape.

Format de réponse : un objet JSON contenant deux champs :
{
  "title": "Titre court et descriptif de l'exercice",
  "statement": "Énoncé complet de l'exercice...",
  "correction": "Corrigé détaillé..."
}

Assure-toi que l'énoncé est autoportant et que le corrigé est pédagogique.
`;

    const openai = await getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Tu es un générateur d'exercices pédagogiques. Réponds uniquement avec le JSON demandé." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    let generated;
    try {
      generated = JSON.parse(responseContent);
      if (!generated.title || !generated.statement || !generated.correction) {
        throw new Error("Format JSON incomplet");
      }
    } catch (e) {
      console.error("Erreur parsing JSON OpenAI:", e);
      return res.status(500).json({ error: "Format de réponse IA invalide." });
    }

    // Créer l'exercice dans la base de données
    const result = await pool.query(
      `INSERT INTO exercises 
       (title, description, content, correction, difficulty, group_id, chapter_id, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        generated.title,
        generated.statement.substring(0, 200) + '...', // description courte
        generated.statement,                          // contenu complet
        generated.correction,
        difficulty,
        group_id,
        chapter_id || null,
        '' // pas de fichier pour l'instant
      ]
    );

    res.status(201).json({
      message: "Exercice généré avec succès.",
      exercise: result.rows[0],
      usage: completion.usage
    });
  } catch (err) {
    console.error("Erreur génération exercice:", err);
    res.status(500).json({ error: "Erreur lors de la génération. Vérifiez la clé API." });
  }
});

// GET /api/ai/usage (inchangé)
router.get("/usage", async (req, res) => {
  res.json({ message: "Fonctionnalité à venir." });
});

module.exports = router;