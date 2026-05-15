const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { generateWithAI } = require("../config/ai");

// ------------------------------------------------------------------
// 🔄 Utilitaire : nettoie la réponse brute de l'IA pour en extraire un JSON
// ------------------------------------------------------------------
function parseAIResponse(raw) {
  if (!raw) return null;
  let cleaned = raw.trim();
  // Supprime les triples backticks et le mot "json" éventuel
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// 🔓 Route publique pour les élèves : astuces (avant middleware admin)
// ------------------------------------------------------------------
router.get("/tips/public", async (req, res) => {
  try {
    const { group_id, category } = req.query;
    let query = "SELECT * FROM tips WHERE 1=1";
    const params = [];
    if (group_id) { params.push(group_id); query += ` AND group_id = $${params.length}`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += " ORDER BY generated_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération astuces." });
  }
});

// ------------------------------------------------------------------
// 🔒 Toutes les routes suivantes nécessitent d'être admin
// ------------------------------------------------------------------
router.use(auth);
router.use(admin);

// ------------------------------------------------------------------
// 📝 POST /api/ai/generate-questions – Génération de questions via IA
// ------------------------------------------------------------------
router.post("/generate-questions", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty, count = 5 } = req.body;

    const group = await pool.query("SELECT name, subject, level FROM groups WHERE id = $1", [group_id]);
    if (group.rows.length === 0) return res.status(404).json({ error: "Groupe non trouvé." });

    const subject = group.rows[0].subject;
    const level = group.rows[0].level;
    let chapterTitle = "général";
    if (chapter_id) {
      const chapter = await pool.query("SELECT title FROM chapters WHERE id = $1", [chapter_id]);
      if (chapter.rows.length > 0) chapterTitle = chapter.rows[0].title;
    }

    const systemInstruction = "Tu es un professeur certifié. Réponds UNIQUEMENT avec un objet JSON valide.";
    const prompt = `Génère ${count} questions à choix multiples pour le chapitre "${chapterTitle}" en ${subject} (niveau ${level}). 
    Chaque question doit avoir un énoncé, quatre propositions, et l'index de la bonne réponse (0-3).
    Difficulté : ${difficulty || 'moyen'}.
    Format JSON attendu : { "questions": [ { "text": "énoncé", "options": ["A","B","C","D"], "correct": 0 } ] }`;

    const raw = await generateWithAI(prompt, systemInstruction);
    const parsed = parseAIResponse(raw);

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({ error: "L'IA n'a pas pu générer de questions valides." });
    }

    // Insérer les questions dans la banque
    for (const q of parsed.questions) {
      await pool.query(
        `INSERT INTO question_bank (group_id, chapter_id, difficulty, question_text, options, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [group_id, chapter_id || null, difficulty, q.text, JSON.stringify(q.options), q.correct]
      );
    }

    res.status(201).json({ message: `${parsed.questions.length} questions générées et enregistrées.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération des questions." });
  }
});

// ------------------------------------------------------------------
// 📝 POST /api/ai/generate-exercise – Génération d'exercice via IA (avec double vérification sécurisée)
// ------------------------------------------------------------------
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

    // --- PREMIÈRE GÉNÉRATION ---
    const systemInstruction = "Tu es un professeur certifié. Réponds UNIQUEMENT avec un objet JSON valide contenant 'title', 'statement', 'correction'.";
    const prompt = `
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
`;

    const raw = await generateWithAI(prompt, systemInstruction);
    const generated = parseAIResponse(raw);

    if (!generated || !generated.title || !generated.statement || !generated.correction) {
      return res.status(500).json({ error: "L'IA n'a pas pu produire un exercice valide." });
    }

    // --- DOUBLE VÉRIFICATION (sécurisée) ---
    let finalExercise = generated;
    try {
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
      const raw2 = await generateWithAI(verifyPrompt, "Tu es un vérificateur pédagogique impitoyable.");
      const verified = parseAIResponse(raw2);
      if (verified && verified.title && verified.statement && verified.correction) {
        finalExercise = verified;
        console.log("✅ Double vérification réussie, exercice corrigé.");
      } else {
        console.warn("⚠️ Double vérification a échoué, utilisation de l'exercice original.");
      }
    } catch (verifyErr) {
      console.warn("⚠️ Erreur lors de la double vérification, utilisation de l'exercice original :", verifyErr.message);
    }

    // --- INSERTION EN BASE ---
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
        ''
      ]
    );

    res.status(201).json({
      message: "Exercice généré avec succès.",
      exercise: result.rows[0],
    });
  } catch (err) {
    console.error("Erreur dans generate-exercise:", err);
    res.status(500).json({ error: "Erreur lors de la génération IA.", detail: err.message });
  }
});

// ------------------------------------------------------------------
// 📝 POST /api/ai/generate-tips – Générer des astuces via IA
// ------------------------------------------------------------------
router.post("/generate-tips", async (req, res) => {
  try {
    const { group_id, category } = req.body;
    const group = await pool.query("SELECT name, subject, level FROM groups WHERE id = $1", [group_id]);
    if (group.rows.length === 0) return res.status(404).json({ error: "Groupe introuvable." });

    const systemInstruction = "Tu es un conseiller pédagogique expert. Réponds uniquement en JSON.";
    const prompt = `Rédige 3 astuces claires et pratiques pour aider des élèves de niveau ${group.rows[0].level} en ${group.rows[0].subject} à réussir leurs ${category}. 
    Chaque astuce doit faire environ 3 phrases. 
    Réponds avec un tableau JSON : { "tips": ["astuce 1", "astuce 2", "astuce 3"] }`;

    const raw = await generateWithAI(prompt, systemInstruction);
    const parsed = parseAIResponse(raw);
    const tips = parsed?.tips || [];

    for (const tip of tips) {
      await pool.query("INSERT INTO tips (group_id, category, content) VALUES ($1, $2, $3)", [group_id, category, tip]);
    }

    res.json({ message: `${tips.length} astuces générées`, tips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur génération astuces." });
  }
});

// ------------------------------------------------------------------
// 📊 GET /api/ai/tips – Récupérer les astuces (admin)
// ------------------------------------------------------------------
router.get("/tips", async (req, res) => {
  try {
    const { group_id, category } = req.query;
    let query = "SELECT * FROM tips WHERE 1=1";
    const params = [];
    if (group_id) { params.push(group_id); query += ` AND group_id = $${params.length}`; }
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += " ORDER BY generated_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération." });
  }
});

// GET /api/ai/usage (inchangé)
router.get("/usage", async (req, res) => {
  res.json({ message: "Fonctionnalité à venir." });
});

module.exports = router;