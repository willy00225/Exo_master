const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

// Toutes les routes ci-dessous nécessitent d'être admin
router.use(auth);
router.use(admin);

// ------------------------------------------------------------
// GET /api/admin/tips – Liste complète des astuces (admin)
// ------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { group_id, category } = req.query;
    let query = `SELECT t.*, g.name AS group_name 
                 FROM tips t 
                 JOIN groups g ON t.group_id = g.id`;
    const params = [];
    const conditions = [];

    if (group_id) {
      params.push(group_id);
      conditions.push(`t.group_id = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`t.category = $${params.length}`);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY t.generated_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération astuces admin :", err);
    res.status(500).json({ error: "Erreur lors du chargement des astuces." });
  }
});

// ------------------------------------------------------------
// POST /api/admin/tips – Créer une astuce manuellement
// ------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { group_id, category, title, content, difficulty } = req.body;

    // Validation basique
    if (!group_id || !category || !content) {
      return res.status(400).json({ error: "Group, category et content sont obligatoires." });
    }

    // Vérifier que le groupe existe
    const groupCheck = await pool.query("SELECT id FROM groups WHERE id = $1", [group_id]);
    if (groupCheck.rows.length === 0) {
      return res.status(400).json({ error: "Groupe introuvable." });
    }

    const result = await pool.query(
      `INSERT INTO tips (group_id, category, title, content, difficulty)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [group_id, category, title || null, content, difficulty || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erreur création astuce :", err);
    res.status(500).json({ error: "Erreur lors de la création de l'astuce." });
  }
});

// ------------------------------------------------------------
// PUT /api/admin/tips/:id – Mettre à jour une astuce
// ------------------------------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, difficulty, group_id } = req.body;

    // Vérifier que l'astuce existe
    const tipCheck = await pool.query("SELECT id FROM tips WHERE id = $1", [id]);
    if (tipCheck.rows.length === 0) {
      return res.status(404).json({ error: "Astuce introuvable." });
    }

    // Construire dynamiquement les champs à mettre à jour
    const fields = [];
    const params = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title); }
    if (content !== undefined) { fields.push(`content = $${idx++}`); params.push(content); }
    if (category !== undefined) { fields.push(`category = $${idx++}`); params.push(category); }
    if (difficulty !== undefined) { fields.push(`difficulty = $${idx++}`); params.push(difficulty); }
    if (group_id !== undefined) { fields.push(`group_id = $${idx++}`); params.push(group_id); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "Aucun champ à mettre à jour." });
    }

    params.push(id);
    const query = `UPDATE tips SET ${fields.join(", ")} WHERE id = $${idx}`;
    await pool.query(query, params);

    res.json({ message: "Astuce mise à jour." });
  } catch (err) {
    console.error("Erreur mise à jour astuce :", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// ------------------------------------------------------------
// DELETE /api/admin/tips/:id – Supprimer une astuce
// ------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM tips WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Astuce introuvable." });
    }
    res.json({ message: "Astuce supprimée." });
  } catch (err) {
    console.error("Erreur suppression astuce :", err);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;