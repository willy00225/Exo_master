const pool = require("../config/db");

const XP_VALUES = {
  quiz_perfect: 50,
  quiz_good: 30,
  quiz_pass: 15,
  exercise_completed: 10,
  challenge_won: 40,
  chapter_completed: 25,
  difficulty_unlocked: 20,
};

const BADGES = {
  first_quiz: { key: "first_quiz", name: "Premier quiz", description: "Avoir réussi son premier quiz", icon: "🎯" },
  quiz_master: { key: "quiz_master", name: "Maître des quiz", description: "10 quiz réussis", icon: "🏆" },
  chapter_complete: { key: "chapter_complete", name: "Chapitre terminé", description: "Tous les exercices d'un chapitre réussis", icon: "📚" },
  perfect_score: { key: "perfect_score", name: "Sans faute", description: "Score parfait à un quiz", icon: "💯" },
  hard_unlocked: { key: "hard_unlocked", name: "Expert en herbe", description: "Difficulté Difficile débloquée", icon: "🔥" },
  streak_3: { key: "streak_3", name: "Série de 3", description: "3 quiz réussis d'affilée", icon: "⚡" },
  challenge_winner: { key: "challenge_winner", name: "Duelliste", description: "Gagner un défi", icon: "⚔️" },
  level_5: { key: "level_5", name: "Niveau 5", description: "Atteindre le niveau 5", icon: "⭐" },
};

async function addXP(userId, amount, reason) {
  await pool.query("INSERT INTO xp_history (user_id, amount, reason) VALUES ($1, $2, $3)", [userId, amount, reason]);
  const result = await pool.query(
    `INSERT INTO student_xp (user_id, total_xp, level)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id)
     DO UPDATE SET total_xp = student_xp.total_xp + $2,
                   level = GREATEST(1, FLOOR((student_xp.total_xp + $2) / 100) + 1),
                   updated_at = NOW()
     RETURNING total_xp, level`,
    [userId, amount]
  );
  return result.rows[0];
}

async function checkAndAwardBadge(userId, badgeKey) {
  const existing = await pool.query("SELECT id FROM student_badges WHERE user_id = $1 AND badge_key = $2", [userId, badgeKey]);
  if (existing.rows.length === 0) {
    await pool.query("INSERT INTO student_badges (user_id, badge_key) VALUES ($1, $2)", [userId, badgeKey]);
    return true;
  }
  return false;
}

module.exports = { addXP, checkAndAwardBadge, XP_VALUES, BADGES };