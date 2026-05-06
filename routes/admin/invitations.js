const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

// Toutes les routes ci-dessous nécessitent d'être admin
router.use(auth);
router.use(admin);

// ------------------------------------------------------------
// GET /api/admin/invitations – Liste complète des invitations
// ------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { status, group_id, challenger_id, challenged_id } = req.query;

    let query = `SELECT i.*, 
                        u1.name AS challenger_name, 
                        u2.name AS challenged_name, 
                        q.title AS quiz_title, 
                        g.name AS group_name
                 FROM invitations i
                 JOIN users u1 ON i.challenger_id = u1.id
                 LEFT JOIN users u2 ON i.challenged_id = u2.id
                 JOIN quizzes q ON i.quiz_id = q.id
                 JOIN groups g ON i.group_id = g.id`;
    const params = [];
    const conditions = [];

    if (status) {
      params.push(status);
      conditions.push(`i.status = $${params.length}`);
    }
    if (group_id) {
      params.push(group_id);
      conditions.push(`i.group_id = $${params.length}`);
    }
    if (challenger_id) {
      params.push(challenger_id);
      conditions.push(`i.challenger_id = $${params.length}`);
    }
    if (challenged_id) {
      params.push(challenged_id);
      conditions.push(`i.challenged_id = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY i.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Erreur récupération invitations admin :", err);
    res.status(500).json({ error: "Erreur lors du chargement des invitations." });
  }
});

// ------------------------------------------------------------
// DELETE /api/admin/invitations/:id – Supprimer une invitation
// ------------------------------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'invitation existe
    const inv = await pool.query("SELECT id FROM invitations WHERE id = $1", [id]);
    if (inv.rows.length === 0) {
      return res.status(404).json({ error: "Invitation introuvable." });
    }

    await pool.query("DELETE FROM invitations WHERE id = $1", [id]);
    res.json({ message: "Invitation supprimée avec succès." });
  } catch (err) {
    console.error("Erreur suppression invitation :", err);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;