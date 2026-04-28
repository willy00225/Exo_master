const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(auth);
router.use(admin);

// POST /api/questions
router.post("/", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty, question_text, options, correct_option, explanation } = req.body;
    const result = await pool.query(
      `INSERT INTO question_bank (group_id, chapter_id, difficulty, question_text, options, correct_option, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [group_id, chapter_id, difficulty, question_text, JSON.stringify(options), correct_option, explanation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création question." });
  }
});

// GET /api/questions?group_id=...&chapter_id=...&difficulty=...
router.get("/", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty } = req.query;
    let query = "SELECT * FROM question_bank WHERE 1=1";
    const params = [];
    if (group_id) { query += ` AND group_id = $${params.length+1}`; params.push(group_id); }
    if (chapter_id) { query += ` AND chapter_id = $${params.length+1}`; params.push(chapter_id); }
    if (difficulty) { query += ` AND difficulty = $${params.length+1}`; params.push(difficulty); }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération." });
  }
});

// PUT /api/questions/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { group_id, chapter_id, difficulty, question_text, options, correct_option, explanation } = req.body;
    await pool.query(
      `UPDATE question_bank SET group_id=$1, chapter_id=$2, difficulty=$3, question_text=$4, options=$5, correct_option=$6, explanation=$7 WHERE id=$8`,
      [group_id, chapter_id, difficulty, question_text, JSON.stringify(options), correct_option, explanation, id]
    );
    res.json({ message: "Question mise à jour." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour." });
  }
});

// DELETE /api/questions/:id
router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM question_bank WHERE id = $1", [req.params.id]);
  res.json({ message: "Question supprimée." });
});

module.exports = router;