const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/admin/challenges - Liste de tous les défis
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u1.name AS challenger_name, u2.name AS challenged_name, q.title AS quiz_title
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN quizzes q ON c.quiz_id = q.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des défis." });
  }
});

module.exports = router;