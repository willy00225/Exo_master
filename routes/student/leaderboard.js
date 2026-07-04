const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, COALESCE(sx.total_xp, 0) AS total_xp, COALESCE(sx.level, 1) AS level
       FROM users u
       LEFT JOIN student_xp sx ON u.id = sx.user_id
       WHERE u.role = 'student'
       ORDER BY total_xp DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement du classement." });
  }
});

module.exports = router;