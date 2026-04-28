const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/settings - Récupérer tous les paramètres
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM settings");
    // Transformer en objet { key: value }
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération paramètres." });
  }
});

// PUT /api/settings - Mettre à jour des paramètres (clé/valeur)
router.put("/", async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }
    res.json({ message: "Paramètres mis à jour." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour paramètres." });
  }
});

module.exports = router;