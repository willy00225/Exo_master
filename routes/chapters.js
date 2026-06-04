const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/chapters – Liste filtrée par classe et/ou matière
router.get("/", async (req, res) => {
  try {
    const { group_id, subject_id } = req.query;   // ⬅️ on accepte subject_id
    let query = `SELECT c.*, 
                        g.name AS group_name,
                        s.name AS subject_name
                 FROM chapters c
                 JOIN groups g ON c.group_id = g.id
                 LEFT JOIN subjects s ON c.subject_id = s.id
                 WHERE 1=1`;
    const params = [];

    if (group_id) {
      query += ` AND c.group_id = $${params.length + 1}`;
      params.push(group_id);
    }

    if (subject_id) {
      query += ` AND c.subject_id = $${params.length + 1}`;
      params.push(subject_id);
    }

    query += " ORDER BY c.order_index ASC, c.title ASC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des chapitres." });
  }
});

// POST /api/chapters – Création (inchangé, mais inclut subject_id)
router.post("/", async (req, res) => {
  try {
    const { group_id, subject_id, title, description, order_index } = req.body;
    const result = await pool.query(
      `INSERT INTO chapters (group_id, subject_id, title, description, order_index)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [group_id, subject_id, title, description, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création chapitre." });
  }
});

// PUT /api/chapters/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order_index, group_id, subject_id } = req.body;
    const result = await pool.query(
      `UPDATE chapters SET title=$1, description=$2, order_index=$3, group_id=$4, subject_id=$5
       WHERE id=$6 RETURNING *`,
      [title, description, order_index, group_id, subject_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour." });
  }
});

// DELETE /api/chapters/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM chapters WHERE id=$1", [req.params.id]);
    res.json({ message: "Chapitre supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression." });
  }
});

module.exports = router;