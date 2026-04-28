const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.use(auth);
router.use(admin);

// Ajouter un élève à un groupe
router.post("/", async (req, res) => {
  try {
    const { user_id, group_id } = req.body;
    await pool.query(
      "INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [user_id, group_id]
    );
    res.status(201).json({ message: "Élève affecté au groupe." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'affectation." });
  }
});

// Retirer un élève d'un groupe
router.delete("/", async (req, res) => {
  try {
    const { user_id, group_id } = req.body;
    await pool.query(
      "DELETE FROM user_groups WHERE user_id = $1 AND group_id = $2",
      [user_id, group_id]
    );
    res.json({ message: "Élève retiré du groupe." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

// Lister les élèves d'un groupe
router.get("/group/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const users = await pool.query(
      `SELECT u.id, u.name, u.email 
       FROM users u
       JOIN user_groups ug ON u.id = ug.user_id
       WHERE ug.group_id = $1`,
      [groupId]
    );
    res.json(users.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Lister les groupes d'un élève
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const groups = await pool.query(
      `SELECT g.id, g.name, g.subject, g.level
       FROM groups g
       JOIN user_groups ug ON g.id = ug.group_id
       WHERE ug.user_id = $1`,
      [userId]
    );
    res.json(groups.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

module.exports = router;