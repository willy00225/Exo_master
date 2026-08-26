const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// GET /api/student/quiz-chapters – Liste des chapitres ayant au moins un quiz pour l'élève
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT DISTINCT c.id, c.title
       FROM quizzes q
       JOIN groups g ON q.group_id = g.id
       JOIN chapters c ON q.chapter_id = c.id
       JOIN user_groups ug ON g.id = ug.group_id
       WHERE ug.user_id = $1 AND q.chapter_id IS NOT NULL
       ORDER BY c.order_index`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des chapitres." });
  }
});

module.exports = router;