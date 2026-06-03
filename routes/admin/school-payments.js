const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// PUT /api/admin/schools/:id/payment – Valider le paiement d'une école
router.put("/:id/payment", async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription_days = 365 } = req.body; // par défaut 1 an

    // Mettre à jour la date d'expiration de l'école
    await pool.query(
      `UPDATE schools SET subscription_expires = NOW() + INTERVAL '1 day' * $1 WHERE id = $2`,
      [subscription_days, id]
    );

    // Appliquer la même date à tous les élèves de cette école
    await pool.query(
      `UPDATE users SET subscription_expires = NOW() + INTERVAL '1 day' * $1
       WHERE school_id = $2 AND role = 'student'`,
      [subscription_days, id]
    );

    res.json({ message: `Abonnement activé pour ${subscription_days} jours.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la validation du paiement." });
  }
});

module.exports = router;