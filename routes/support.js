const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// ---------- Élève / Visiteur – création d'un ticket ----------
router.post("/contact", async (req, res) => {
  try {
    const { email, message, subject } = req.body;
    if (!message) return res.status(400).json({ error: "Message requis." });

    await pool.query(
      `INSERT INTO support_messages (email, subject, message, status)
       VALUES ($1, $2, $3, 'open')`,
      [email || null, subject || 'Demande de support', message]
    );
    res.json({ message: "Votre message a été envoyé. Nous vous répondons rapidement." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ---------- Élève connecté – Historique de ses tickets ----------
router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await pool.query(
      `SELECT id, subject, message, status, admin_notes, created_at, updated_at
       FROM support_messages
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    res.json(tickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ---------- Admin – Lister tous les tickets ----------
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    if (user.rows[0]?.role !== 'admin') return res.status(403).json({ error: "Accès interdit." });

    const { status } = req.query;
    let query = `SELECT s.*, u.name as user_name, u.email as user_email
                 FROM support_messages s
                 LEFT JOIN users u ON s.user_id = u.id`;
    const params = [];
    if (status) {
      query += " WHERE s.status = $1";
      params.push(status);
    }
    query += " ORDER BY s.created_at DESC";

    const tickets = await pool.query(query, params);
    res.json(tickets.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ---------- Admin – Modifier le statut ou ajouter une note ----------
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await pool.query("SELECT role FROM users WHERE id = $1", [userId]);
    if (user.rows[0]?.role !== 'admin') return res.status(403).json({ error: "Accès interdit." });

    const { id } = req.params;
    const { status, admin_notes } = req.body;

    await pool.query(
      `UPDATE support_messages SET status = COALESCE($1, status), admin_notes = COALESCE($2, admin_notes), updated_at = NOW()
       WHERE id = $3`,
      [status, admin_notes, id]
    );
    res.json({ message: "Ticket mis à jour." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;