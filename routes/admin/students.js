const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/admin/students - Liste des élèves (non admin)
router.get("/", async (req, res) => {
  try {
    const { group_id, subscription_status } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.subscription_expires, u.created_at,
             array_agg(json_build_object('id', g.id, 'name', g.name)) AS groups
      FROM users u
      LEFT JOIN user_groups ug ON u.id = ug.user_id
      LEFT JOIN groups g ON ug.group_id = g.id
      WHERE u.role = 'student'
    `;
    const params = [];
    if (group_id) {
      query += ` AND u.id IN (SELECT user_id FROM user_groups WHERE group_id = $${params.length+1})`;
      params.push(group_id);
    }
    query += ` GROUP BY u.id`;
    if (subscription_status === 'active') {
      query += ` HAVING u.subscription_expires IS NOT NULL AND u.subscription_expires > NOW()`;
    } else if (subscription_status === 'expired') {
      query += ` HAVING u.subscription_expires IS NULL OR u.subscription_expires <= NOW()`;
    }
    query += ` ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des élèves." });
  }
});

// PUT /api/admin/students/:id/subscription - Modifier l'abonnement
router.put("/:id/subscription", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, days } = req.body; // action: 'extend', 'revoke', 'set'
    let newDate;

    if (action === 'extend') {
      newDate = `NOW() + INTERVAL '${days} days'`;
    } else if (action === 'revoke') {
      newDate = `NOW() - INTERVAL '1 day'`;
    } else if (action === 'set') {
      newDate = `'${req.body.date}'`;
    } else {
      return res.status(400).json({ error: "Action invalide." });
    }

    await pool.query(
      `UPDATE users SET subscription_expires = ${newDate} WHERE id = $1`,
      [id]
    );
    res.json({ message: "Abonnement mis à jour." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// GET /api/admin/students/:id/payments - Historique des paiements
router.get("/:id/payments", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération." });
  }
});

module.exports = router;