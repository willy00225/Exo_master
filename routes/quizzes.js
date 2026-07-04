const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const subscription = require("../middleware/subscription");
const { addXP, checkAndAwardBadge, XP_VALUES, BADGES } = require("../utils/gamification");

// Fonction utilitaire : calcul du temps limite
const calculateTimeLimit = (difficulty, questionCount) => {
  const baseTime = { easy: 45, medium: 60, hard: 90, very_hard: 120 };
  return (baseTime[difficulty] || 60) * questionCount;
};

// ----------------------
// ROUTES ÉLÈVES (AVANT le middleware admin)
// ----------------------

// GET /api/quizzes/available - Quiz disponibles pour l'élève
router.get("/available", auth, subscription, async (req, res) => {
  try {
    const userId = req.user.id;
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

// POST /api/quizzes/:id/start – Génère les questions, les sauvegarde dans la tentative, et les renvoie sans les réponses.
router.post("/:id/start", auth, subscription, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await pool.query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
    if (quiz.rows.length === 0) return res.status(404).json({ error: "Quiz non trouvé." });

    const quizData = quiz.rows[0];
    const { group_id, chapter_id, difficulty_filter, question_count } = quizData;

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

    const questionsForStudent = questions.map(q => ({
      id: q.id,
      text: q.question_text,
      options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? q.options.split(' ').filter(Boolean) : []),
    }));

    const attempt = await pool.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, started_at, questions)
       VALUES ($1, $2, 0, $3, NOW(), $4) RETURNING id`,
      [req.user.id, quizId, questions.length, JSON.stringify(questions)]
    );

    res.json({
      attempt_id: attempt.rows[0].id,
      title: quizData.title,
      time_limit: quizData.time_limit || calculateTimeLimit(difficulty_filter || 'easy', questions.length),
      questions: questionsForStudent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur démarrage quiz." });
  }
});

// POST /api/quizzes/:id/submit – Corrige, enregistre le score, attribue XP et badges.
router.post("/:id/submit", auth, subscription, async (req, res) => {
  try {
    const quizId = req.params.id;
    const { attempt_id, answers, time_spent } = req.body;

    const attempt = await pool.query(
      "SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2",
      [attempt_id, req.user.id]
    );
    if (attempt.rows.length === 0) {
      return res.status(404).json({ error: "Tentative introuvable." });
    }

    const questions = attempt.rows[0].questions;

    const parseNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return Number(val.replace(',', '.'));
      return NaN;
    };

    let score = 0;
    const corrections = questions.map((q) => {
      const userAnswer = answers.find(a => a.questionId === q.id);
      const selectedOption = userAnswer ? userAnswer.selectedOption : null;
      const correctIndex = q.correct_option;

      let correct = (selectedOption === correctIndex);

      if (!correct && selectedOption !== null && selectedOption !== undefined) {
        const correctValue = parseNumeric(q.options[correctIndex]);
        const selectedValue = parseNumeric(q.options[selectedOption]);
        if (!isNaN(correctValue) && !isNaN(selectedValue)) {
          correct = correctValue === selectedValue;
        }
      }

      if (!correct && selectedOption !== null && selectedOption !== undefined) {
        console.warn(`[Quiz] Correction ambiguë pour la question ${q.id} : attendu ${correctIndex}, reçu ${selectedOption}`);
      }

      if (correct) score++;

      return {
        questionId: q.id,
        text: q.question_text,
        options: q.options,
        correctOption: correctIndex,
        explanation: q.explanation || "",
        selectedOption: selectedOption,
        isCorrect: correct,
      };
    });

    await pool.query(
      `UPDATE quiz_attempts SET score = $1, time_spent = $2, completed_at = NOW()
       WHERE id = $3`,
      [score, time_spent, attempt_id]
    );

    const percentage = (score / questions.length) * 100;

    // ------------- 🎮 GAMIFICATION ---------------
    // XP selon le score
    if (percentage === 100) {
      await addXP(req.user.id, XP_VALUES.quiz_perfect, "Score parfait au quiz");
      await checkAndAwardBadge(req.user.id, BADGES.perfect_score.key);
    } else if (percentage >= 70) {
      await addXP(req.user.id, XP_VALUES.quiz_good, "Quiz réussi (≥70%)");
    } else if (percentage >= 50) {
      await addXP(req.user.id, XP_VALUES.quiz_pass, "Quiz réussi (≥50%)");
    }

    // Badge premier quiz
    const quizCount = await pool.query("SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1", [req.user.id]);
    if (parseInt(quizCount.rows[0].count) === 1) {
      await checkAndAwardBadge(req.user.id, BADGES.first_quiz.key);
    }

    // Badge streak (3 succès consécutifs)
    const recentAttempts = await pool.query(
      "SELECT score, total_questions FROM quiz_attempts WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 3",
      [req.user.id]
    );
    if (recentAttempts.rows.length === 3) {
      const allPassed = recentAttempts.rows.every(r => (r.score / r.total_questions) >= 0.7);
      if (allPassed) {
        await checkAndAwardBadge(req.user.id, BADGES.streak_3.key);
      }
    }

    // Badge maître des quiz (10 quiz réussis)
    const passedCount = await pool.query(
      "SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1 AND score * 1.0 / total_questions >= 0.7",
      [req.user.id]
    );
    if (parseInt(passedCount.rows[0].count) >= 10) {
      await checkAndAwardBadge(req.user.id, BADGES.quiz_master.key);
    }

    res.json({
      score,
      total: questions.length,
      percentage: Math.round(percentage),
      corrections,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur soumission." });
  }
});

// GET /api/quizzes/leaderboard/:quizId - Classement
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

// ----------------------
// ROUTES ADMIN (protégées par auth + admin)
// ----------------------
router.use(auth);
router.use(admin);

// POST /api/quizzes - Créer un quiz
router.post("/", async (req, res) => {
  try {
    const { title, description, group_id, chapter_id, difficulty, question_count = 10 } = req.body;
    const difficulty_filter = difficulty;
    const time_limit = calculateTimeLimit(difficulty, question_count);

    const result = await pool.query(
      `INSERT INTO quizzes (title, description, group_id, chapter_id, difficulty, question_count, difficulty_filter, time_limit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, group_id, chapter_id || null, difficulty, question_count, difficulty_filter, time_limit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création quiz." });
  }
});

// GET /api/quizzes - Lister les quiz (admin)
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
    const { title, description, group_id, chapter_id, difficulty, question_count = 10 } = req.body;
    const difficulty_filter = difficulty;
    const time_limit = calculateTimeLimit(difficulty, question_count);

    const result = await pool.query(
      `UPDATE quizzes SET title=$1, description=$2, group_id=$3, chapter_id=$4,
       difficulty=$5, question_count=$6, difficulty_filter=$7, time_limit=$8 WHERE id=$9 RETURNING *`,
      [title, description, group_id, chapter_id || null, difficulty, question_count, difficulty_filter, time_limit, id]
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

module.exports = router;