const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");
const { addXP, checkAndAwardBadge, XP_VALUES, BADGES } = require("../../utils/gamification");

router.use(auth);
router.use(subscription);

// ------------------------------------------------------------------
// GET /api/student/difficulty-progress – difficulté actuelle par chapitre
// ------------------------------------------------------------------
router.get("/difficulty-progress", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `SELECT c.id AS chapter_id, c.title AS chapter_title,
              g.name AS group_name, g.id AS group_id,
              COALESCE(p.current_difficulty, 'easy') AS current_difficulty
       FROM chapters c
       JOIN groups g ON c.group_id = g.id
       JOIN user_groups ug ON g.id = ug.group_id
       LEFT JOIN student_difficulty_progress p ON p.chapter_id = c.id AND p.user_id = $1
       WHERE ug.user_id = $1
       ORDER BY g.name, c.order_index`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de la progression." });
  }
});

// ------------------------------------------------------------------
// POST /api/student/check-unlock – débloque la difficulté suivante
// ------------------------------------------------------------------
router.post("/check-unlock", async (req, res) => {
  try {
    const userId = req.user.id;
    const { chapter_id } = req.body;

    const progress = await pool.query(
      "SELECT current_difficulty FROM student_difficulty_progress WHERE user_id = $1 AND chapter_id = $2",
      [userId, chapter_id]
    );
    const current = progress.rows[0]?.current_difficulty || 'easy';

    const quizPassed = await pool.query(
      `SELECT qa.score, qa.total_questions
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = $1
         AND q.chapter_id = $2
         AND q.difficulty_filter = $3
         AND qa.score * 1.0 / qa.total_questions >= 0.7
       LIMIT 1`,
      [userId, chapter_id, current]
    );

    if (quizPassed.rows.length > 0) {
      const difficulties = ['easy', 'medium', 'hard', 'very_hard'];
      const currentIndex = difficulties.indexOf(current);
      if (currentIndex < difficulties.length - 1) {
        const next = difficulties[currentIndex + 1];
        await pool.query(
          `INSERT INTO student_difficulty_progress (user_id, group_id, chapter_id, current_difficulty)
           VALUES ($1, (SELECT group_id FROM chapters WHERE id = $2), $2, $3)
           ON CONFLICT (user_id, group_id, chapter_id)
           DO UPDATE SET current_difficulty = EXCLUDED.current_difficulty, unlocked_at = NOW()`,
          [userId, chapter_id, next]
        );

        await addXP(userId, XP_VALUES.difficulty_unlocked, `Difficulté ${next} débloquée`);
        if (next === 'hard' || next === 'very_hard') {
          await checkAndAwardBadge(userId, BADGES.hard_unlocked.key);
        }

        return res.json({ unlocked: true, new_difficulty: next });
      }
      return res.json({ unlocked: true, new_difficulty: current, message: "Niveau maximum atteint !" });
    }
    res.json({ unlocked: false, current_difficulty: current });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la vérification." });
  }
});

// ------------------------------------------------------------------
// GET /api/student/gamification – XP, niveau et badges
// ------------------------------------------------------------------
router.get("/gamification", async (req, res) => {
  try {
    const userId = req.user.id;

    const xp = await pool.query(
      "SELECT total_xp, level FROM student_xp WHERE user_id = $1",
      [userId]
    );

    const badges = await pool.query(
      "SELECT sb.badge_key, sb.awarded_at FROM student_badges sb WHERE sb.user_id = $1 ORDER BY sb.awarded_at DESC",
      [userId]
    );

    res.json({
      xp: xp.rows[0] || { total_xp: 0, level: 1 },
      badges: badges.rows.map(b => ({
        badge_key: b.badge_key,
        name: BADGES[b.badge_key]?.name || b.badge_key,
        description: BADGES[b.badge_key]?.description || "",
        icon: BADGES[b.badge_key]?.icon || "🏅",
        awarded_at: b.awarded_at,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement de la gamification." });
  }
});

// ------------------------------------------------------------------
// 🆕 GET /api/student/leaderboard – Classement global par XP
// ------------------------------------------------------------------
router.get("/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, COALESCE(xp.total_xp, 0) AS total_xp, COALESCE(xp.level, 1) AS level
       FROM users u
       LEFT JOIN student_xp xp ON u.id = xp.user_id
       WHERE u.role = 'student'
       ORDER BY total_xp DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement du classement." });
  }
});

module.exports = router;