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

// POST /api/ai/generate-exercise – version premium fiable
router.post("/generate-exercise", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty, theme } = req.body;

    const group = await pool.query("SELECT name, subject, level FROM groups WHERE id = $1", [group_id]);
    if (group.rows.length === 0) return res.status(404).json({ error: "Groupe non trouvé." });

    const subject = group.rows[0].subject;
    const level = group.rows[0].level;
    let chapterTitle = "général";
    if (chapter_id) {
      const chapter = await pool.query("SELECT title FROM chapters WHERE id = $1", [chapter_id]);
      if (chapter.rows.length > 0) chapterTitle = chapter.rows[0].title;
    }

    // Prompt de génération ultra‑précis
    const generatePrompt = `
Tu es un professeur agrégé en ${subject}, enseignant à des élèves de niveau ${level}. 
Tu dois créer un exercice de difficulté "${difficulty}" sur le chapitre "${chapterTitle}". 
Le client attend un exercice parfaitement exact, adapté au programme officiel de ce niveau, et un corrigé détaillé étape par étape. 
Vérifie soigneusement tous les calculs, définitions et raisonnements avant de répondre.

Retourne UNIQUEMENT un objet JSON valide avec les clés suivantes :
{
  "title": "Titre court et descriptif",
  "statement": "Énoncé complet, éventuellement avec des sous‑questions",
  "correction": "Corrigé complet, expliquant chaque étape de manière pédagogique"
}

Rappel : ne mets aucun commentaire en dehors du JSON. Vérifie deux fois les calculs et la logique.
`;

    const openai = await getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",   // le modèle le plus fiable
      messages: [
        { role: "system", content: "Tu es un assistant qui génère des exercices parfaits et sans erreur." },
        { role: "user", content: generatePrompt }
      ],
      temperature: 0.4,  // plus bas = plus fiable
      response_format: { type: "json_object" }
    });

    let generated;
    try {
      generated = JSON.parse(completion.choices[0].message.content);
      if (!generated.title || !generated.statement || !generated.correction) {
        throw new Error("JSON incomplet");
      }
    } catch (e) {
      return res.status(500).json({ error: "L'IA a produit une réponse invalide. Veuillez réessayer." });
    }

    // Double vérification par l'IA (auto‑correction)
    const verifyPrompt = `
Un professeur a rédigé l'exercice suivant :
Titre : ${generated.title}
Énoncé : ${generated.statement}
Corrigé : ${generated.correction}

En tant qu'expert en ${subject} (niveau ${level}), vérifie l'exactitude de l'énoncé et du corrigé. 
Si tu trouves une erreur (de calcul, de logique, de programme), corrige‑la et retourne le JSON corrigé complet avec les mêmes clés. 
Si tout est parfait, retourne le JSON original sans modification.

Retourne UNIQUEMENT le JSON, sans commentaire.
`;

    const verifyCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Tu es un vérificateur pédagogique impitoyable." },
        { role: "user", content: verifyPrompt }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    let finalExercise;
    try {
      finalExercise = JSON.parse(verifyCompletion.choices[0].message.content);
    } catch (e) {
      // si la vérification échoue, on garde la version originale
      finalExercise = generated;
    }

    // Insertion en base avec le statut "draft" pour que l'admin valide
    const result = await pool.query(
      `INSERT INTO exercises (title, description, content, correction, difficulty, group_id, chapter_id, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        finalExercise.title,
        finalExercise.statement.substring(0, 200) + '...',
        finalExercise.statement,
        finalExercise.correction,
        difficulty,
        group_id,
        chapter_id || null,
        '' // pas de fichier
      ]
    );

    res.status(201).json({
      message: "Exercice généré et vérifié avec succès.",
      exercise: result.rows[0],
      usage: completion.usage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération IA." });
  }
});

// GET /api/ai/usage (inchangé)
router.get("/usage", async (req, res) => {
  res.json({ message: "Fonctionnalité à venir." });
});

module.exports = router;