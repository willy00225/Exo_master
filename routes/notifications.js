const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

router.use(auth);

// GET /api/notifications - Liste des notifications non lues (et récentes)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur" });
  }
});

// PUT /api/notifications/:id/read - Marquer comme lu
router.put("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    res.json({ message: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur" });
  }
});

module.exports = router;