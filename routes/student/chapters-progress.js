const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const subscription = require("../../middleware/subscription");

router.use(auth);
router.use(subscription);

// GET /api/student/chapters-progress?group_id=...&subject_id=...
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const { group_id, subject_id } = req.query;
    if (!group_id || !subject_id) {
      return res.status(400).json({ error: "group_id et subject_id requis" });
    }

    // Tous les chapitres ordonnés de ce groupe/matière
    const chapters = await pool.query(
      `SELECT c.id, c.title, c.order_index
       FROM chapters c
       WHERE c.group_id = $1 AND c.subject_id = $2
       ORDER BY c.order_index`,
      [group_id, subject_id]
    );

    // Progression difficulté (déjà existante)
    const difficulty = await pool.query(
      `SELECT chapter_id, current_difficulty
       FROM student_difficulty_progress
       WHERE user_id = $1`,
      [userId]
    );
    const diffMap = {};
    difficulty.rows.forEach(r => { diffMap[r.chapter_id] = r.current_difficulty; });

    // Nombre d'exercices complétés par chapitre
    const attempts = await pool.query(
      `SELECT e.chapter_id, COUNT(DISTINCT ea.exercise_id) AS done
       FROM exercise_attempts ea
       JOIN exercises e ON ea.exercise_id = e.id
       WHERE ea.user_id = $1 AND e.group_id = $2
       GROUP BY e.chapter_id`,
      [userId, group_id]
    );
    const exercisesDoneMap = {};
    attempts.rows.forEach(r => { exercisesDoneMap[r.chapter_id] = parseInt(r.done); });

    // Nombre total d'exercices par chapitre (toutes difficultés confondues pour simplifier)
    const totalEx = await pool.query(
      `SELECT chapter_id, COUNT(*) AS total
       FROM exercises
       WHERE group_id = $1
       GROUP BY chapter_id`,
      [group_id]
    );
    const totalMap = {};
    totalEx.rows.forEach(r => { totalMap[r.chapter_id] = parseInt(r.total); });

    // Quiz réussi (au moins un quiz du chapitre avec >=70%)
    const quizzesPassed = await pool.query(
      `SELECT q.chapter_id
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       WHERE qa.user_id = $1 AND q.group_id = $2
         AND qa.score * 1.0 / qa.total_questions >= 0.7
       GROUP BY q.chapter_id`,
      [userId, group_id]
    );
    const quizPassedSet = new Set(quizzesPassed.rows.map(r => r.chapter_id));

    // Pourcentage social (combien d'élèves du même groupe ont réussi au moins un quiz du chapitre)
    const social = await pool.query(
      `SELECT q.chapter_id,
              COUNT(DISTINCT qa.user_id) * 100.0 / GREATEST(1, (
                SELECT COUNT(*) FROM user_groups ug2 WHERE ug2.group_id = $1
              )) AS percent
       FROM quiz_attempts qa
       JOIN quizzes q ON qa.quiz_id = q.id
       JOIN user_groups ug ON qa.user_id = ug.user_id AND ug.group_id = $1
       WHERE q.group_id = $1 AND qa.score * 1.0 / qa.total_questions >= 0.7
       GROUP BY q.chapter_id`,
      [group_id]
    );
    const socialMap = {};
    social.rows.forEach(r => { socialMap[r.chapter_id] = Math.round(parseFloat(r.percent)); });

    // Construire la réponse
    const result = chapters.rows.map((ch, index) => {
      const isFirst = index === 0;
      const prevChapter = index > 0 ? chapters.rows[index - 1] : null;
      const currentDiff = diffMap[ch.id] || 'easy';
      const exercisesDone = exercisesDoneMap[ch.id] || 0;
      const totalExercises = totalMap[ch.id] || 0;
      const quizPassed = quizPassedSet.has(ch.id);
      // Un chapitre est considéré comme "terminé" s'il a réussi un quiz (on peut raffiner avec difficulté max)
      const isCompleted = quizPassed;
      const previousCompleted = isFirst ? true : (prevChapter && quizPassedSet.has(prevChapter.id));
      return {
        id: ch.id,
        title: ch.title,
        order_index: ch.order_index,
        current_difficulty: currentDiff,
        exercises_done: exercisesDone,
        total_exercises: totalExercises,
        quiz_passed: quizPassed,
        is_completed: isCompleted,
        is_unlocked: isFirst || previousCompleted,  // ne peut pas sauter un chapitre
        social_percent: socialMap[ch.id] || 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;