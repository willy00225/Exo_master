const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// Toutes ces routes nécessitent d'être authentifié ET admin
router.use(auth);
router.use(admin);

// ➕ Créer un groupe
router.post("/", async (req, res) => {
  try {
    const { name, subject, level } = req.body;
    const newGroup = await pool.query(
      "INSERT INTO groups (name, subject, level) VALUES ($1, $2, $3) RETURNING *",
      [name, subject, level]
    );
    res.status(201).json(newGroup.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la création du groupe." });
  }
});

// 📋 Lister tous les groupes
router.get("/", async (req, res) => {
  try {
    const groups = await pool.query("SELECT * FROM groups ORDER BY created_at DESC");
    res.json(groups.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des groupes." });
  }
});

// ✏️ Modifier un groupe
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, level } = req.body;
    const updatedGroup = await pool.query(
      "UPDATE groups SET name = $1, subject = $2, level = $3 WHERE id = $4 RETURNING *",
      [name, subject, level, id]
    );
    if (updatedGroup.rows.length === 0) {
      return res.status(404).json({ error: "Groupe non trouvé." });
    }
    res.json(updatedGroup.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// ❌ Supprimer un groupe
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await pool.query("DELETE FROM groups WHERE id = $1 RETURNING id", [id]);
    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: "Groupe non trouvé." });
    }
    res.json({ message: "Groupe supprimé avec succès." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;