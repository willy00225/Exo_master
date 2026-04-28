const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const subscription = require("../middleware/subscription");

// Fonction utilitaire : calcul du temps limite selon difficulté et nombre de questions
const calculateTimeLimit = (difficulty, questionCount) => {
  const baseTime = {
    easy: 45,
    medium: 60,
    hard: 90,
    very_hard: 120
  };
  return (baseTime[difficulty] || 60) * questionCount;
};

// ----------------------
// ROUTES ADMIN
// ----------------------
router.use(auth);
router.use(admin);

// POST /api/quizzes - Créer un quiz
router.post("/", async (req, res) => {
  try {
    const { title, description, group_id, chapter_id, difficulty, questions } = req.body;
    const questionCount = questions.length;
    const time_limit = calculateTimeLimit(difficulty, questionCount);

    const result = await pool.query(
      `INSERT INTO quizzes (title, description, group_id, chapter_id, difficulty, questions, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, group_id, chapter_id, difficulty, JSON.stringify(questions), time_limit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création quiz." });
  }
});

// GET /api/quizzes - Liste des quiz (admin)
router.get("/", async (req, res) => {
  try {
    const { group_id, chapter_id } = req.query;
    let query = "SELECT * FROM quizzes";
    const params = [];
    if (group_id) {
      query += " WHERE group_id = $1";
      params.push(group_id);
    } else if (chapter_id) {
      query += " WHERE chapter_id = $1";
      params.push(chapter_id);
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération." });
  }
});

// GET /api/quizzes/:id - Détail d'un quiz
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM quizzes WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Quiz non trouvé." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/quizzes/:id - Modifier un quiz
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, group_id, chapter_id, difficulty, questions } = req.body;
    const questionCount = questions.length;
    const time_limit = calculateTimeLimit(difficulty, questionCount);

    const result = await pool.query(
      `UPDATE quizzes SET title=$1, description=$2, group_id=$3, chapter_id=$4,
       difficulty=$5, questions=$6, time_limit=$7 WHERE id=$8 RETURNING *`,
      [title, description, group_id, chapter_id, difficulty, JSON.stringify(questions), time_limit, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour." });
  }
});

// DELETE /api/quizzes/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM quizzes WHERE id = $1", [req.params.id]);
    res.json({ message: "Quiz supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression." });
  }
});

// ----------------------
// ROUTES ÉLÈVES
// ----------------------

// GET /api/quizzes/available - Quiz disponibles pour l'élève (avec abonnement actif)
router.get("/available", auth, subscription, async (req, res) => {
  try {
    const userId = req.user.id;
    // Récupérer les groupes de l'élève
    const userGroups = await pool.query(
      `SELECT group_id FROM user_groups WHERE user_id = $1`,
      [userId]
    );
    const groupIds = userGroups.rows.map(g => g.group_id);
    if (groupIds.length === 0) return res.json([]);

    const result = await pool.query(
      `SELECT q.*, g.name as group_name, g.subject, g.level
       FROM quizzes q
       JOIN groups g ON q.group_id = g.id
       WHERE q.group_id = ANY($1::int[])
       ORDER BY q.created_at DESC`,
      [groupIds]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/quizzes/:id/start - Démarrer une tentative (génération automatique depuis question_bank)
router.post("/:id/start", auth, subscription, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await pool.query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
    if (quiz.rows.length === 0) return res.status(404).json({ error: "Quiz non trouvé." });

    const quizData = quiz.rows[0];
    const { group_id, chapter_id, difficulty_filter, question_count } = quizData;

    // Construire la requête pour piocher des questions aléatoires
    let query = "SELECT * FROM question_bank WHERE group_id = $1";
    const params = [group_id];
    if (chapter_id) {
      query += ` AND chapter_id = $${params.length + 1}`;
      params.push(chapter_id);
    }
    if (difficulty_filter) {
      query += ` AND difficulty = $${params.length + 1}`;
      params.push(difficulty_filter);
    }
    query += ` ORDER BY RANDOM() LIMIT $${params.length + 1}`;
    params.push(question_count);

    const questionsResult = await pool.query(query, params);
    const questions = questionsResult.rows;

    if (questions.length === 0) {
      return res.status(404).json({ error: "Aucune question disponible pour ce quiz." });
    }

    // Préparer les questions sans les réponses
    const questionsForStudent = questions.map(q => ({
      id: q.id,
      text: q.question_text,
      options: q.options,
    }));

    // Créer une tentative
    const attempt = await pool.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, started_at)
       VALUES ($1, $2, 0, $3, NOW()) RETURNING id`,
      [req.user.id, quizId, questions.length]
    );

    res.json({
      attempt_id: attempt.rows[0].id,
      title: quizData.title,
      time_limit: quizData.time_limit || calculateTimeLimit(quizData.difficulty_filter || 'easy', questions.length),
      questions: questionsForStudent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur démarrage quiz." });
  }
});

// POST /api/quizzes/:id/submit - Soumettre les réponses
router.post("/:id/submit", auth, subscription, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { attempt_id, answers, time_spent } = req.body; // answers: [{questionId, selectedOption}]

    const quiz = await pool.query("SELECT questions FROM quizzes WHERE id = $1", [quizId]);
    if (quiz.rows.length === 0) return res.status(404).json({ error: "Quiz non trouvé." });

    const questions = quiz.rows[0].questions;
    let score = 0;
    questions.forEach((q, index) => {
      const userAnswer = answers.find(a => a.questionId === q.id);
      if (userAnswer && userAnswer.selectedOption === q.correctOption) {
        score++;
      }
    });

    // Mettre à jour la tentative
    await pool.query(
      `UPDATE quiz_attempts SET score = $1, time_spent = $2, completed_at = NOW()
       WHERE id = $3`,
      [score, time_spent, attempt_id]
    );

    res.json({
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur soumission." });
  }
});

// GET /api/quizzes/leaderboard/:quizId - Classement pour un quiz
router.get("/leaderboard/:quizId", auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const result = await pool.query(
      `SELECT u.name, qa.score, qa.time_spent, qa.completed_at
       FROM quiz_attempts qa
       JOIN users u ON qa.user_id = u.id
       WHERE qa.quiz_id = $1
       ORDER BY qa.score DESC, qa.time_spent ASC
       LIMIT 20`,
      [quizId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur classement." });
  }
});

module.exports = router;