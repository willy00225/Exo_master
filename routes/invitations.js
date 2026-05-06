const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// ----------------------------------------------------------------------
// POST /api/invitations – Créer un lien d’invitation à un défi
// ----------------------------------------------------------------------
router.post("/", auth, async (req, res) => {
  try {
    const { quiz_id } = req.body;
    const challenger_id = req.user.id;

    // 1. Récupérer le groupe de l’élève
    const group = await pool.query(
      "SELECT group_id FROM user_groups WHERE user_id = $1 LIMIT 1",
      [challenger_id]
    );
    if (group.rows.length === 0) {
      return res.status(400).json({ error: "Vous n'appartenez à aucun groupe." });
    }
    const groupId = group.rows[0].group_id;

    // 2. Vérifier que le quiz existe et qu’il appartient à ce groupe
    const quiz = await pool.query(
      "SELECT id, title FROM quizzes WHERE id = $1 AND group_id = $2",
      [quiz_id, groupId]
    );
    if (quiz.rows.length === 0) {
      return res.status(400).json({ error: "Quiz introuvable ou non accessible." });
    }

    // 3. Durée de validité de l’invitation (peut être enregistrée dans la table settings)
    const expiryDays = 1; // par défaut 1 jour
    const token = crypto.randomBytes(16).toString("hex");

    await pool.query(
      `INSERT INTO invitations (token, challenger_id, quiz_id, group_id, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '1 day' * $5)`,
      [token, challenger_id, quiz_id, groupId, expiryDays]
    );

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${token}`;
    res.status(201).json({
      link: inviteLink,
      message: "Lien d’invitation créé. Envoyez‑le à un camarade.",
      quiz: quiz.rows[0].title,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de l’invitation." });
  }
});

// ----------------------------------------------------------------------
// GET /api/invitations/:token – Vérifier une invitation
// ----------------------------------------------------------------------
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pool.query(
      `SELECT i.*, u.name AS challenger_name, q.title AS quiz_title 
       FROM invitations i 
       JOIN users u ON i.challenger_id = u.id 
       JOIN quizzes q ON i.quiz_id = q.id 
       WHERE i.token = $1 AND i.status = 'pending' AND i.expires_at > NOW()`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lien d’invitation invalide ou expiré." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ----------------------------------------------------------------------
// POST /api/invitations/:token/accept – Accepter l’invitation et lancer le défi
// ----------------------------------------------------------------------
router.post("/:token/accept", auth, async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    // 1. Vérifier la validité de l’invitation
    const inv = await pool.query(
      `SELECT * FROM invitations 
       WHERE token = $1 AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );
    if (inv.rows.length === 0) {
      return res.status(404).json({ error: "Invitation invalide ou expirée." });
    }

    const { challenger_id, quiz_id, group_id } = inv.rows[0];

    // Empêcher le challenger d’accepter sa propre invitation
    if (challenger_id === userId) {
      return res.status(400).json({ error: "Vous ne pouvez pas accepter votre propre invitation." });
    }

    // 2. Ajouter l’utilisateur au groupe (s’il n’y est pas déjà)
    await pool.query(
      "INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, group_id]
    );

    // 3. Vérifier qu’aucun défi identique n’est déjà en attente entre ces deux élèves pour ce quiz
    const existingChallenge = await pool.query(
      `SELECT id FROM challenges 
       WHERE challenger_id = $1 AND challenged_id = $2 AND quiz_id = $3 AND status = 'pending'`,
      [challenger_id, userId, quiz_id]
    );
    if (existingChallenge.rows.length > 0) {
      return res.status(400).json({ error: "Un défi identique est déjà en attente." });
    }

    // 4. Créer le défi
    await pool.query(
      `INSERT INTO challenges (challenger_id, challenged_id, quiz_id, status)
       VALUES ($1, $2, $3, 'pending')`,
      [challenger_id, userId, quiz_id]
    );

    // 5. Marquer l’invitation comme acceptée
    await pool.query("UPDATE invitations SET status = 'accepted' WHERE id = $1", [inv.rows[0].id]);

    res.json({ message: "Défi accepté ! Vous pouvez maintenant le relever." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l’acceptation." });
  }
});

module.exports = router;