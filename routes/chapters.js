const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Toutes les routes sont admin
router.use(auth);
router.use(admin);

// POST /api/chapters - Créer un chapitre
router.post("/", async (req, res) => {
  try {
    const { group_id, title, description, order_index } = req.body;
    const result = await pool.query(
      `INSERT INTO chapters (group_id, title, description, order_index)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [group_id, title, description, order_index || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création chapitre." });
  }
});

// GET /api/chapters?group_id=... - Lister les chapitres d'un groupe
router.get("/", async (req, res) => {
  try {
    const { group_id } = req.query;
    let query = "SELECT * FROM chapters";
    const params = [];
    if (group_id) {
      query += " WHERE group_id = $1";
      params.push(group_id);
    }
    query += " ORDER BY order_index ASC, title ASC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération." });
  }
});

// PUT /api/chapters/:id - Modifier un chapitre
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order_index } = req.body;
    const result = await pool.query(
      `UPDATE chapters SET title = $1, description = $2, order_index = $3
       WHERE id = $4 RETURNING *`,
      [title, description, order_index, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour." });
  }
});

// DELETE /api/chapters/:id - Supprimer un chapitre
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM chapters WHERE id = $1", [req.params.id]);
    res.json({ message: "Chapitre supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression." });
  }
});

module.exports = router;