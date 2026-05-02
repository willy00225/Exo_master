const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

// Import du helper de notification
const { createNotification } = require("../utils/notificationHelper");

// ----------------------
// ROUTES ÉLÈVES
// ----------------------

// POST /api/payments/submit - Soumettre une preuve de paiement manuelle
router.post("/submit", auth, upload.single("proof"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, transaction_ref, payment_method = "manual" } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "La capture d'écran ou la preuve de paiement est requise." });
    }

    const proofPath = `/uploads/payments/${file.filename}`;

    // Vérifier si l'utilisateur a déjà un paiement en attente
    const pending = await pool.query(
      "SELECT id FROM payments WHERE user_id = $1 AND status = 'pending'",
      [userId]
    );

    if (pending.rows.length > 0) {
      // Supprimer l'ancien fichier si existant
      return res.status(400).json({
        error: "Vous avez déjà une demande de paiement en attente. Veuillez attendre la validation.",
      });
    }

    await pool.query(
      `INSERT INTO payments (user_id, amount, transaction_ref, proof_image, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [userId, amount, transaction_ref, proofPath, payment_method]
    );

    res.status(201).json({
      message: "Preuve de paiement soumise avec succès. Votre accès sera activé après validation par l'administrateur.",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la soumission. Veuillez réessayer." });
  }
});

// GET /api/payments/my - Historique des paiements de l'élève connecté
router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await pool.query(
      `SELECT id, amount, transaction_ref, status, payment_method, created_at, validated_at,
              subscription_days, admin_notes
       FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(payments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// GET /api/payments/status - Vérifier le statut d'abonnement actuel
router.get("/status", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await pool.query(
      "SELECT subscription_expires FROM users WHERE id = $1",
      [userId]
    );

    const expires = user.rows[0]?.subscription_expires;
    const isActive = expires && new Date(expires) > new Date();

    res.json({
      is_active: isActive,
      expires_at: expires,
      days_remaining: expires ? Math.ceil((new Date(expires) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ----------------------
// ROUTES ADMIN
// ----------------------

router.use(auth);
router.use(admin);

// GET /api/payments/pending - Liste des paiements en attente avec détails utilisateur
router.get("/pending", async (req, res) => {
  try {
    const payments = await pool.query(
      `SELECT p.id, p.amount, p.transaction_ref, p.proof_image, p.created_at,
              p.payment_method, p.subscription_days,
              u.id as user_id, u.name as user_name, u.email as user_email,
              (SELECT json_agg(json_build_object('id', g.id, 'name', g.name))
               FROM user_groups ug JOIN groups g ON ug.group_id = g.id
               WHERE ug.user_id = u.id) as groups
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`
    );
    res.json(payments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/payments/:id/validate - Valider un paiement
router.put("/:id/validate", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { subscription_days = 30, admin_notes } = req.body;

    const payment = await pool.query(
      "SELECT user_id FROM payments WHERE id = $1 AND status = 'pending'",
      [id]
    );

    if (payment.rows.length === 0) {
      return res.status(404).json({ error: "Paiement non trouvé ou déjà traité." });
    }

    const userId = payment.rows[0].user_id;

    // Mettre à jour le paiement
    await pool.query(
      `UPDATE payments SET status = 'validated', validated_by = $1, validated_at = NOW(),
       subscription_days = $2, admin_notes = $3 WHERE id = $4`,
      [adminId, subscription_days, admin_notes, id]
    );

    // Activer l'abonnement
    await pool.query(
      `UPDATE users SET subscription_expires = NOW() + INTERVAL '1 day' * $1 WHERE id = $2`,
      [subscription_days, userId]
    );

    // NOTIFICATION AUTOMATIQUE
    try {
      await createNotification({
        userId: userId,
        message: "Votre paiement a été validé. Abonnement activé pour " + subscription_days + " jours.",
        type: "success",
        link: "/student/profile"
      });
    } catch (notifErr) {
      console.error("Erreur lors de la création de la notification:", notifErr.message);
      // Ne pas bloquer la réponse en cas d'erreur de notification
    }

    res.json({
      message: `Paiement validé. Abonnement activé pour ${subscription_days} jours.`,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/payments/:id/reject - Rejeter un paiement
router.put("/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const result = await pool.query(
      `UPDATE payments SET status = 'rejected', validated_at = NOW(), admin_notes = $1
       WHERE id = $2 AND status = 'pending' RETURNING id`,
      [admin_notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paiement non trouvé ou déjà traité." });
    }

    // Notification de rejet (optionnelle)
    try {
      const paymentInfo = await pool.query("SELECT user_id FROM payments WHERE id = $1", [id]);
      if (paymentInfo.rows.length > 0) {
        await createNotification({
          userId: paymentInfo.rows[0].user_id,
          message: "Votre paiement a été rejeté. " + (admin_notes ? "Motif : " + admin_notes : "Contactez l'administration."),
          type: "error",
          link: "/student/subscription"
        });
      }
    } catch (notifErr) {
      console.error("Erreur notification rejet:", notifErr.message);
    }

    res.json({ message: "Paiement rejeté." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// GET /api/payments/all - Tous les paiements avec filtres
router.get("/all", async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = `
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM payments p
      JOIN users u ON p.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }
    if (user_id) {
      conditions.push(`p.user_id = $${params.length + 1}`);
      params.push(user_id);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY p.created_at DESC";

    const payments = await pool.query(query, params);
    res.json(payments.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;