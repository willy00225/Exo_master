const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/admin/subjects
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM subjects ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des matières." });
  }
});

// POST /api/admin/subjects
router.post("/", async (req, res) => {
  try {
    const { name, slug } = req.body;
    const result = await pool.query(
      "INSERT INTO subjects (name, slug) VALUES ($1, $2) RETURNING *",
      [name, slug]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de la matière." });
  }
});

// PUT /api/admin/subjects/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;
    const result = await pool.query(
      "UPDATE subjects SET name = $1, slug = $2 WHERE id = $3 RETURNING *",
      [name, slug, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Matière non trouvée." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// DELETE /api/admin/subjects/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM subjects WHERE id = $1", [req.params.id]);
    res.json({ message: "Matière supprimée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;