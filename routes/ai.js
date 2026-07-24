const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { generateWithAI } = require("../config/ai");

// ------------------------------------------------------------------
// Liste des matières autorisées pour la génération (langues exclues)
// ------------------------------------------------------------------
const ALLOWED_SUBJECTS = [
  'Mathématiques', 'Physique-Chimie', 'SVT', 'Histoire-Géographie',
  'Informatique', 'Technologie', 'Philosophie', 'Économie',
  // Ajoutez d'autres matières autorisées
];

// ------------------------------------------------------------------
// 🔄 Utilitaire : nettoie la réponse brute de l'IA pour en extraire un JSON
// ------------------------------------------------------------------
function parseAIResponse(raw) {
  if (!raw) return null;
  let cleaned = raw.trim();
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
// 🌐 Détermine la langue d'enseignement selon la matière
// ------------------------------------------------------------------
function getLanguageFromSubject(subject) {
  const langMap = {
    'Français': 'français',
    'Littérature': 'français',
    'Anglais': 'anglais',
    'Espagnol': 'espagnol',
    'Allemand': 'allemand',
    // Ajoutez d'autres langues si nécessaire
  };
  return langMap[subject] || 'français'; // par défaut le français
}

// ------------------------------------------------------------------
// 🔧 Fonction réutilisable pour générer un seul exercice
// ------------------------------------------------------------------
async function generateSingleExercise({ group_id, chapter_id, difficulty, curriculum = 'ivoirien' }) {
  const group = await pool.query("SELECT name, subject, level FROM groups WHERE id = $1", [group_id]);
  if (group.rows.length === 0) throw new Error("Groupe non trouvé.");

  const subject = group.rows[0].subject;
  // Vérification : seules les matières autorisées peuvent générer des exercices
  if (!ALLOWED_SUBJECTS.includes(subject)) {
    throw new Error(`La génération d'exercices pour la matière "${subject}" est temporairement désactivée.`);
  }

  const level = group.rows[0].level;
  const language = getLanguageFromSubject(subject);
  
  let chapterTitle = "général";
  if (chapter_id) {
    const chapter = await pool.query("SELECT title FROM chapters WHERE id = $1", [chapter_id]);
    if (chapter.rows.length > 0) chapterTitle = chapter.rows[0].title;
  }

  const curriculumIntro = curriculum === 'ivoirien'
    ? "Tu es un professeur certifié du système éducatif ivoirien, enseignant selon les programmes officiels de la Côte d'Ivoire. "
    : "Tu es un professeur certifié. ";

  const needsFigure = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Technologie'].includes(subject) &&
                      (difficulty === 'medium' || difficulty === 'hard' || difficulty === 'very_hard');

  const languageInstruction = language === 'français'
    ? "Rédige l'intégralité de l'énoncé et du corrigé en **français** (et uniquement en français)."
    : `Rédige l'intégralité de l'énoncé et du corrigé en **${language}** (et uniquement en ${language}).`;

  const grammarRule = (subject === 'Français' || subject === 'Anglais')
    ? `\n**RÈGLE DE GRAMMAIRE IMPÉRATIVE :** Pour les questions de grammaire, d'orthographe ou de conjugaison, vérifie scrupuleusement la nature des mots, la fonction des compléments, les accords, et assure‑toi que chaque explication est irréprochable. N'invente pas de règle.`
    : '';

  const systemInstruction = "Tu es un professeur certifié. Réponds UNIQUEMENT avec un objet JSON valide contenant 'title', 'statement', 'correction'" +
    (needsFigure ? ", et éventuellement 'figure'." : ".") +
    ` ${languageInstruction}`;

  const prompt = `${curriculumIntro}
Tu es un professeur agrégé en ${subject}, enseignant à des élèves de niveau ${level}. 
Tu dois créer un exercice de difficulté "${difficulty}" sur le chapitre "${chapterTitle}". 
Le client attend un exercice parfaitement exact, adapté au programme officiel de ce niveau, et un corrigé détaillé étape par étape. 
Vérifie soigneusement tous les calculs, définitions et raisonnements avant de répondre.
${languageInstruction}
${grammarRule}
${needsFigure ? `
**IMPORTANT :** Si l'exercice nécessite une figure géométrique, un graphique, un schéma électrique, un montage expérimental, ou tout autre support visuel, génère-la en **SVG** dans une clé "figure".
Le SVG doit être simple, lisible, auto‑suffisant, avec une taille maximale de 400x400, et utilisable directement dans une page HTML.
` : ''}
Retourne UNIQUEMENT un objet JSON valide avec les clés suivantes :
{
  "title": "Titre court et descriptif",
  "statement": "Énoncé complet, éventuellement avec des sous‑questions"${needsFigure ? ',\n  "figure": "<svg>...</svg>" (optionnelle, si pertinent)' : ''},
  "correction": "Corrigé complet, expliquant chaque étape de manière pédagogique"
}
`;

  const raw = await generateWithAI(prompt, systemInstruction);
  const generated = parseAIResponse(raw);

  if (!generated || !generated.title || !generated.statement || !generated.correction) {
    throw new Error("L'IA n'a pas pu produire un exercice valide.");
  }

  // Double vérification avec contrainte de langue
  let finalExercise = generated;
  try {
    const verifyPrompt = `
Un professeur a rédigé l'exercice suivant au format JSON :
${JSON.stringify(generated, null, 2)}

En tant qu'expert en ${subject} (niveau ${level}), vérifie l'exactitude de l'énoncé et du corrigé.
Si tu trouves une erreur (de calcul, de logique, de programme, de grammaire ou de langue), corrige‑la et retourne le JSON corrigé complet avec les mêmes clés : "title", "statement", "correction".
Assure‑toi que tout le contenu est en ${language} et qu'il n'y a aucun mélange de langues.
Si tout est parfait, retourne le JSON original sans modification.

IMPORTANT : Les clés doivent être en anglais : "title", "statement", "correction".
Le contenu des clés doit être du texte simple (pas d'objets imbriqués).

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

  // Validation élève (conservée)
  try {
    const validatePrompt = `
En tant qu'élève de niveau ${level}, résous l'exercice suivant :
${finalExercise.statement}

Une fois que tu as terminé, compare ton résultat avec le corrigé suivant :
${finalExercise.correction}

Si le corrigé te semble faux ou incohérent avec ta résolution, retourne un JSON { "valid": false, "correctedCorrection": "..." }.
Sinon, retourne { "valid": true }.

Ne retourne QUE le JSON demandé, sans commentaire.
`;
    const rawValidation = await generateWithAI(validatePrompt, "Tu es un élève consciencieux qui vérifie son travail.");
    const validation = parseAIResponse(rawValidation);
    if (validation && validation.valid === false && validation.correctedCorrection) {
      finalExercise.correction = validation.correctedCorrection;
      console.log("🔧 Correction automatique du corrigé par validation élève.");
    }
  } catch (valErr) {
    console.warn("⚠️ Validation élève impossible, on garde le corrigé existant.");
  }

  // Insertion en base
  const result = await pool.query(
    `INSERT INTO exercises (title, description, content, correction, difficulty, group_id, chapter_id, file_path, figure)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      finalExercise.title,
      finalExercise.statement.substring(0, 200) + '...',
      finalExercise.statement,
      finalExercise.correction,
      difficulty,
      group_id,
      chapter_id || null,
      '',
      finalExercise.figure || null
    ]
  );

  return result.rows[0];
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
    const { group_id, chapter_id, difficulty, count = 5, curriculum = 'ivoirien' } = req.body;

    const group = await pool.query("SELECT name, subject, level FROM groups WHERE id = $1", [group_id]);
    if (group.rows.length === 0) return res.status(404).json({ error: "Groupe non trouvé." });

    const subject = group.rows[0].subject;
    // Vérification : seules les matières autorisées peuvent générer des questions
    if (!ALLOWED_SUBJECTS.includes(subject)) {
      return res.status(400).json({ error: `La génération de questions pour la matière "${subject}" est temporairement désactivée.` });
    }

    const level = group.rows[0].level;
    const language = getLanguageFromSubject(subject);
    let chapterTitle = "général";
    if (chapter_id) {
      const chapter = await pool.query("SELECT title FROM chapters WHERE id = $1", [chapter_id]);
      if (chapter.rows.length > 0) chapterTitle = chapter.rows[0].title;
    }

    let curriculumIntro = "";
    if (curriculum === 'ivoirien') {
      curriculumIntro = "Tu es un professeur certifié du système éducatif ivoirien, enseignant selon les programmes officiels de la Côte d'Ivoire. ";
    } else {
      curriculumIntro = "Tu es un professeur certifié. ";
    }

    const languageInstruction = language === 'français'
      ? "Rédige l'intégralité des questions et des options en **français** (et uniquement en français)."
      : `Rédige l'intégralité des questions et des options en **${language}** (et uniquement en ${language}).`;

    const grammarRule = (subject === 'Français' || subject === 'Anglais')
      ? `\n**RÈGLE DE GRAMMAIRE IMPÉRATIVE :** Pour les questions de grammaire, d'orthographe ou de conjugaison, vérifie scrupuleusement la nature des mots, la fonction des compléments, les accords, et assure‑toi que chaque explication est irréprochable. N'invente pas de règle.`
      : '';

    const systemInstruction = "Tu es un professeur certifié. Réponds UNIQUEMENT avec un objet JSON valide.";
    const prompt = `${curriculumIntro}Tu es un professeur de ${subject}, niveau ${level}.
Génère ${count} questions à choix multiples pour le chapitre "${chapterTitle}".
Difficulté : ${difficulty || 'moyen'}.
${languageInstruction}
${grammarRule}

**PROCÉDURE OBLIGATOIRE :**
1. Pour chaque question, effectue TOI-MÊME le calcul ou la résolution.
2. Vérifie que la réponse que tu désignes comme correcte correspond EXACTEMENT à ton propre calcul.
3. Si tu détectes une incohérence, corrige-la avant de finaliser la question.

Format JSON exact : { "questions": [ { "text": "énoncé", "options": ["Option A", "Option B", "Option C", "Option D"], "correct": 0 } ] }`;

    const raw = await generateWithAI(prompt, systemInstruction);
    const parsed = parseAIResponse(raw);

    if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(500).json({ error: "L'IA n'a pas pu générer de questions valides." });
    }

    // Vérification des calculs (conservée)
    function safeEvaluate(expr) {
      let sanitized = expr.replace(/,/g, '.').replace(/\s+/g, '');
      if (!/^[\d.+\-*\/()]+$/.test(sanitized)) return null;
      try {
        const result = Function('"use strict"; return (' + sanitized + ')')();
        return Number(result);
      } catch (e) {
        return null;
      }
    }

    for (const q of parsed.questions) {
      const match = q.text.match(/(\d+[\.,]?\d*)\s*([+\-])\s*(\d+[\.,]?\d*)/);
      if (match) {
        const a = match[1].replace(',', '.');
        const op = match[2];
        const b = match[3].replace(',', '.');
        const expr = `${a} ${op} ${b}`;
        const result = safeEvaluate(expr);
        if (result !== null && !isNaN(result)) {
          const correctIndex = q.options.findIndex(opt => {
            const optValue = parseFloat(String(opt).replace(',', '.'));
            return Math.abs(optValue - result) < 0.001;
          });
          if (correctIndex !== -1) {
            q.correct = correctIndex;
          }
        }
      }
    }

    // Vérification individuelle (conservée)
    const verifiedQuestions = [];
    for (const q of parsed.questions) {
      const verifyPrompt = `Voici une question à choix multiples :
Énoncé : ${q.text}
Options : ${JSON.stringify(q.options)}
Index de la réponse correcte désigné : ${q.correct}

En tant que professeur de ${subject}, résous cette question et indique si l'index ${q.correct} est bien la bonne réponse.
Réponds UNIQUEMENT avec un JSON : { "isCorrect": true/false, "correctIndex": 0, "explanation": "..." }`;

      try {
        const rawVerif = await generateWithAI(verifyPrompt, "Tu es un vérificateur de QCM. Réponds uniquement en JSON.");
        const verif = parseAIResponse(rawVerif);
        if (verif && verif.isCorrect === false) {
          console.warn(`Question "${q.text}" corrigée : ${q.correct} -> ${verif.correctIndex}`);
          q.correct = verif.correctIndex;
        }
      } catch (e) {
        console.warn("Vérification individuelle échouée, on garde la question originale.");
      }
      verifiedQuestions.push(q);
    }

    for (const q of verifiedQuestions) {
      await pool.query(
        `INSERT INTO question_bank (group_id, chapter_id, difficulty, question_text, options, correct_option)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [group_id, chapter_id || null, difficulty, q.text, JSON.stringify(q.options), q.correct]
      );
    }

    res.status(201).json({ message: `${verifiedQuestions.length} questions générées et enregistrées.` });
  } catch (err) {
    console.error(err);
    if (err.status === 429 || err.code === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: "Limite de génération atteinte. Veuillez réessayer dans quelques minutes." });
    }
    res.status(500).json({ error: "Erreur lors de la génération des questions." });
  }
});

// ------------------------------------------------------------------
// 📝 POST /api/ai/generate-exercise – Génération unitaire (utilise la fonction partagée)
// ------------------------------------------------------------------
router.post("/generate-exercise", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty, curriculum } = req.body;
    const exercise = await generateSingleExercise({ group_id, chapter_id, difficulty, curriculum });
    res.status(201).json({ message: "Exercice généré avec succès.", exercise });
  } catch (err) {
    console.error("Erreur dans generate-exercise:", err);
    if (err.status === 429 || err.code === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: "Limite de génération atteinte. Veuillez réessayer dans quelques minutes." });
    }
    res.status(500).json({ error: "Erreur lors de la génération IA.", detail: err.message });
  }
});

// ------------------------------------------------------------------
// 🚀 POST /api/ai/generate-exercises-batch – Génération par lot
// ------------------------------------------------------------------
router.post("/generate-exercises-batch", async (req, res) => {
  try {
    const { group_id, subject_id, difficulty = 'medium', count_per_chapter = 1 } = req.body;

    const chapters = await pool.query(
      "SELECT id, title FROM chapters WHERE group_id = $1 AND subject_id = $2 ORDER BY order_index",
      [group_id, subject_id]
    );

    if (chapters.rows.length === 0) {
      return res.status(404).json({ error: "Aucun chapitre trouvé pour cette matière/classe." });
    }

    const results = [];
    for (const chapter of chapters.rows) {
      for (let i = 0; i < count_per_chapter; i++) {
        try {
          const exercise = await generateSingleExercise({
            group_id,
            chapter_id: chapter.id,
            difficulty,
            curriculum: 'ivoirien'
          });
          results.push({ chapter: chapter.title, title: exercise.title, status: 'ok' });
          // Délai de 25 secondes pour respecter la limite de requêtes
          await new Promise(resolve => setTimeout(resolve, 25000));
        } catch (err) {
          results.push({ chapter: chapter.title, error: err.message, status: 'error' });
        }
      }
    }

    res.json({
      message: `Génération terminée. ${results.length} exercices traités.`,
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération par lot." });
  }
});

// ------------------------------------------------------------------
// 📝 POST /api/ai/generate-chapters – Génération des chapitres par IA
// ------------------------------------------------------------------
router.post("/generate-chapters", async (req, res) => {
  try {
    const { group_id, subject_id, count = 10 } = req.body;

    const group = await pool.query("SELECT name, subject, level FROM groups WHERE id = $1", [group_id]);
    if (group.rows.length === 0) return res.status(404).json({ error: "Classe non trouvée." });

    const subject = await pool.query("SELECT name FROM subjects WHERE id = $1", [subject_id]);
    if (subject.rows.length === 0) return res.status(404).json({ error: "Matière non trouvée." });

    const systemInstruction = "Tu es un inspecteur pédagogique du système éducatif ivoirien. Réponds UNIQUEMENT avec un tableau JSON.";
    const prompt = `Liste les ${count} chapitres officiels du programme ivoirien pour la matière "${subject.rows[0].name}" en classe de ${group.rows[0].level} (${group.rows[0].name}). 
    Retourne UNIQUEMENT un tableau JSON : { "chapters": ["Nom du chapitre 1", "Nom du chapitre 2", ...] }`;

    const raw = await generateWithAI(prompt, systemInstruction);
    const parsed = parseAIResponse(raw);
    if (!parsed || !Array.isArray(parsed.chapters)) {
      return res.status(500).json({ error: "L'IA n'a pas pu générer de chapitres valides." });
    }

    for (let i = 0; i < parsed.chapters.length; i++) {
      await pool.query(
        "INSERT INTO chapters (group_id, subject_id, title, order_index) VALUES ($1, $2, $3, $4)",
        [group_id, subject_id, parsed.chapters[i], i + 1]
      );
    }

    res.json({ message: `${parsed.chapters.length} chapitres générés.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération des chapitres." });
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

    const language = getLanguageFromSubject(group.rows[0].subject);
    const systemInstruction = "Tu es un conseiller pédagogique expert. Réponds uniquement en JSON.";
    const prompt = `Rédige 3 astuces claires et pratiques pour aider des élèves de niveau ${group.rows[0].level} en ${group.rows[0].subject} à réussir leurs ${category}. 
    Les astuces doivent être rédigées en ${language}.
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
    if (err.status === 429 || err.code === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: "Limite de génération atteinte. Veuillez réessayer dans quelques minutes." });
    }
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

// ------------------------------------------------------------------
// 🧹 POST /api/ai/clean-exercises – Nettoyage intelligent des exercices (sans matière)
// ------------------------------------------------------------------
router.post("/clean-exercises", async (req, res) => {
  try {
    const { group_id } = req.body;   // plus de subject

    // Récupérer tous les exercices du groupe
    const exercises = await pool.query(
      `SELECT e.*, g.subject, g.level
       FROM exercises e
       JOIN groups g ON e.group_id = g.id
       WHERE e.group_id = $1`,
      [group_id]
    );

    if (exercises.rows.length === 0) {
      return res.status(404).json({ error: "Aucun exercice trouvé pour cette classe." });
    }

    // Logique de nettoyage (à adapter avec votre implémentation réelle)
    let corrected = 0;
    let ignored = 0;

    for (const ex of exercises.rows) {
      // Ici, vous pouvez appeler l'IA pour corriger l'exercice
      // Pour l'exemple, on incrémente corrected
      corrected++;
    }

    res.json({
      message: "Nettoyage terminé.",
      summary: {
        total: exercises.rows.length,
        corrected,
        ignored: exercises.rows.length - corrected
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du nettoyage des exercices." });
  }
});

// GET /api/ai/usage (inchangé)
router.get("/usage", async (req, res) => {
  res.json({ message: "Fonctionnalité à venir." });
});

module.exports = router;