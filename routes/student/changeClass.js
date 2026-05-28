const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// PUT /api/student/change-class
router.put("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { new_group_id } = req.body;

    // Vérifier que le groupe existe
    const groupCheck = await pool.query("SELECT id FROM groups WHERE id = $1", [new_group_id]);
    if (groupCheck.rows.length === 0) {
      return res.status(404).json({ error: "Classe introuvable." });
    }

    // Vérifier le nombre de changements cette année
    const currentYear = new Date().getFullYear();
    const changesThisYear = await pool.query(
      `SELECT COUNT(*) FROM class_changes 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM changed_at) = $2`,
      [userId, currentYear]
    );
    const count = parseInt(changesThisYear.rows[0].count);
    if (count >= 2) {
      return res.status(400).json({ error: "Vous avez déjà changé de classe 2 fois cette année. Impossible de changer à nouveau." });
    }

    // Récupérer l'ancien groupe
    const oldGroup = await pool.query(
      "SELECT group_id FROM user_groups WHERE user_id = $1",
      [userId]
    );
    const oldGroupId = oldGroup.rows[0]?.group_id;

    // Mettre à jour l'affectation
    await pool.query("DELETE FROM user_groups WHERE user_id = $1", [userId]);
    await pool.query("INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)", [userId, new_group_id]);

    // Enregistrer le changement
    await pool.query(
      "INSERT INTO class_changes (user_id, old_group_id, new_group_id) VALUES ($1, $2, $3)",
      [userId, oldGroupId, new_group_id]
    );

    res.json({ message: "Classe changée avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du changement de classe." });
  }
});

module.exports = router;