const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");

// GET /api/student/users – Élèves des mêmes groupes que moi
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer les IDs des groupes de l'utilisateur connecté
    const userGroups = await pool.query(
      "SELECT group_id FROM user_groups WHERE user_id = $1",
      [userId]
    );
    const groupIds = userGroups.rows.map(r => r.group_id);

    if (groupIds.length === 0) {
      return res.json([]);
    }

    // Récupérer tous les utilisateurs (sauf moi) partageant au moins un de ces groupes
    const users = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.email
       FROM users u
       JOIN user_groups ug ON u.id = ug.user_id
       WHERE ug.group_id = ANY($1::int[])
         AND u.id != $2`,
      [groupIds, userId]
    );

    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;