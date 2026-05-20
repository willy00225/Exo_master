const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// GET /api/student/classmates
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    // Récupérer les groupes de l'élève
    const userGroups = await pool.query(
      "SELECT group_id FROM user_groups WHERE user_id = $1",
      [userId]
    );
    const groupIds = userGroups.rows.map(g => g.group_id);
    if (groupIds.length === 0) return res.json([]);

    // Récupérer les autres élèves de ces groupes
    const classmates = await pool.query(
      `SELECT DISTINCT u.id, u.name 
       FROM users u
       JOIN user_groups ug ON u.id = ug.user_id
       WHERE ug.group_id = ANY($1::int[]) AND u.id != $2 AND u.role = 'student'`,
      [groupIds, userId]
    );
    res.json(classmates.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;