const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// GET /api/student/stats/dashboard – Stats complètes pour le tableau de bord
router.get("/dashboard", async (req, res) => {
  try {
    const userId = req.user.id;

    // Total exercices complétés (ayant une tentative)
    const exercisesDone = await pool.query(
      `SELECT COUNT(DISTINCT exercise_id) FROM exercise_attempts WHERE user_id = $1`,
      [userId]
    );

    // Total quiz passés
    const quizzesDone = await pool.query(
      "SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1",
      [userId]
    );

    // Moyenne des scores quiz
    const avgScore = await pool.query(
      `SELECT COALESCE(ROUND(AVG(score * 100.0 / NULLIF(total_questions,0)), 1), 0) AS avg
       FROM quiz_attempts WHERE user_id = $1`,
      [userId]
    );

    // Progression des scores (7 derniers jours)
    const scoreProgress = await pool.query(
      `SELECT DATE(completed_at) AS date,
              ROUND(AVG(score * 100.0 / NULLIF(total_questions,0)), 1) AS avg_score,
              COUNT(*) AS count
       FROM quiz_attempts
       WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '7 days'
       GROUP BY DATE(completed_at)
       ORDER BY date`,
      [userId]
    );

    // Répartition du temps passé (par jour)
    const timeSpent = await pool.query(
      `SELECT DATE(completed_at) AS date,
              SUM(time_spent) AS total_seconds
       FROM quiz_attempts
       WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '7 days'
       GROUP BY DATE(completed_at)
       ORDER BY date`,
      [userId]
    );

    // Nombre de badges
    const badgesCount = await pool.query(
      "SELECT COUNT(*) FROM student_badges WHERE user_id = $1",
      [userId]
    );

    // Niveau et XP
    const xp = await pool.query(
      "SELECT total_xp, level FROM student_xp WHERE user_id = $1",
      [userId]
    );

    res.json({
      exercises_done: parseInt(exercisesDone.rows[0].count),
      quizzes_done: parseInt(quizzesDone.rows[0].count),
      avg_score: parseFloat(avgScore.rows[0].avg),
      score_progress: scoreProgress.rows,
      time_spent: timeSpent.rows,
      badges: parseInt(badgesCount.rows[0].count),
      xp: xp.rows[0] || { total_xp: 0, level: 1 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des statistiques." });
  }
});

module.exports = router;