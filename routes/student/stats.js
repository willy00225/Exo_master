const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// GET /api/student/stats
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Statistiques globales
    const globalStats = await pool.query(`
      SELECT 
        COUNT(qa.id) AS total_attempts,
        COALESCE(ROUND(AVG(qa.score * 100.0 / NULLIF(qa.total_questions, 0)), 1), 0) AS average_score,
        COALESCE(MAX(qa.score * 100.0 / NULLIF(qa.total_questions, 0)), 0) AS best_score
      FROM quiz_attempts qa
      WHERE qa.user_id = $1
    `, [userId]);

    // 2. Dernières tentatives (5) avec nom du quiz
    const recentAttempts = await pool.query(`
      SELECT qa.id, q.title AS quiz_title, qa.score, qa.total_questions, qa.time_spent, qa.completed_at
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = $1
      ORDER BY qa.completed_at DESC
      LIMIT 5
    `, [userId]);

    // 3. Performance par chapitre (moyenne, nombre de quiz)
    const perChapter = await pool.query(`
      SELECT 
        COALESCE(ch.title, 'Sans chapitre') AS chapter_title,
        COUNT(qa.id) AS attempts,
        ROUND(AVG(qa.score * 100.0 / NULLIF(qa.total_questions, 0)), 1) AS average_score
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      LEFT JOIN chapters ch ON q.chapter_id = ch.id
      WHERE qa.user_id = $1
      GROUP BY ch.id, ch.title
      ORDER BY average_score DESC
    `, [userId]);

    res.json({
      total_attempts: parseInt(globalStats.rows[0].total_attempts),
      average_score: parseFloat(globalStats.rows[0].average_score),
      best_score: parseFloat(globalStats.rows[0].best_score),
      recent_attempts: recentAttempts.rows,
      per_chapter: perChapter.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des statistiques." });
  }
});

module.exports = router;