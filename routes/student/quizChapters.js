const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// GET /api/student/quiz-chapters – Liste des chapitres disponibles pour l'élève
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT DISTINCT c.id, c.title, c.order_index
       FROM user_groups ug
       JOIN groups g ON ug.group_id = g.id
       JOIN chapters c ON c.group_id = g.id
       WHERE ug.user_id = $1
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