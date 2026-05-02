const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/admin/stats
router.get("/", async (req, res) => {
  try {
    const [studentsRes, groupsRes, pendingPaymentsRes, quizzesRes, challengesRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*) FROM groups"),
      pool.query("SELECT COUNT(*) FROM payments WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM quizzes"),
      pool.query("SELECT COUNT(*) FROM challenges WHERE status = 'pending' OR status = 'accepted'")
    ]);

    const stats = {
      students: parseInt(studentsRes.rows[0].count),
      groups: parseInt(groupsRes.rows[0].count),
      pendingPayments: parseInt(pendingPaymentsRes.rows[0].count),
      quizzes: parseInt(quizzesRes.rows[0].count),
      activeChallenges: parseInt(challengesRes.rows[0].count)
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des statistiques." });
  }
});

// GET /api/admin/stats/monthly - Inscriptions par mois (pour graphique)
router.get("/monthly", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) 
      FROM users 
      WHERE created_at > NOW() - INTERVAL '12 months'
      GROUP BY month 
      ORDER BY month
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur." });
  }
});

// GET /api/admin/stats/payments-by-method
router.get("/payments-by-method", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT payment_method, COUNT(*)::int AS count 
      FROM payments 
      GROUP BY payment_method
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur" });
  }
});

// GET /api/admin/stats/students-by-group
router.get("/students-by-group", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.name AS group_name, COUNT(ug.user_id)::int AS student_count
      FROM groups g
      LEFT JOIN user_groups ug ON g.id = ug.group_id
      GROUP BY g.id, g.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur" });
  }
});

module.exports = router;