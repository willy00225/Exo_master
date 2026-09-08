const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const webpush = require("../config/webpush");

// POST /api/notifications/subscribe
router.post("/subscribe", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint, keys } = req.body;
    const { p256dh, auth: authKey } = keys;

    if (!endpoint || !p256dh || !authKey) {
      return res.status(400).json({ error: "Données d'abonnement invalides." });
    }

    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [userId, endpoint, p256dh, authKey]
    );

    res.status(201).json({ message: "Abonnement enregistré." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// POST /api/notifications/unsubscribe
router.post("/unsubscribe", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    await pool.query(
      "DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2",
      [userId, endpoint]
    );
    res.json({ message: "Abonnement supprimé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;