const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const subscription = require("../middleware/subscription");

// Toutes les routes nécessitent authentification et abonnement actif
router.use(auth);
router.use(subscription);

// POST /api/challenges - Créer un défi
router.post("/", async (req, res) => {
  try {
    const challengerId = req.user.id;
    const { challenged_id, quiz_id } = req.body;

    // Vérifier que le quiz existe et appartient à un groupe de l'utilisateur
    const quizCheck = await pool.query(
      `SELECT q.* FROM quizzes q
       JOIN user_groups ug ON q.group_id = ug.group_id
       WHERE q.id = $1 AND ug.user_id = $2`,
      [quiz_id, challengerId]
    );
    if (quizCheck.rows.length === 0) {
      return res.status(400).json({ error: "Quiz non accessible." });
    }

    // Vérifier que le challenged existe et est dans le même groupe
    const userCheck = await pool.query(
      `SELECT u.id FROM users u
       JOIN user_groups ug ON u.id = ug.user_id
       WHERE u.id = $1 AND ug.group_id = $2`,
      [challenged_id, quizCheck.rows[0].group_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: "L'élève défié n'appartient pas au même groupe." });
    }

    // Éviter les doublons en attente
    const existing = await pool.query(
      `SELECT id FROM challenges 
       WHERE challenger_id = $1 AND challenged_id = $2 AND quiz_id = $3 AND status = 'pending'`,
      [challengerId, challenged_id, quiz_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Un défi est déjà en attente pour ce quiz." });
    }

    const result = await pool.query(
      `INSERT INTO challenges (challenger_id, challenged_id, quiz_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [challengerId, challenged_id, quiz_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création du défi." });
  }
});

// GET /api/challenges/pending - Défis en attente (reçus ou envoyés)
router.get("/pending", async (req, res) => {
  try {
    const userId = req.user.id;
    // Défis reçus en attente
    const received = await pool.query(
      `SELECT c.*, u.name as challenger_name, q.title as quiz_title
       FROM challenges c
       JOIN users u ON c.challenger_id = u.id
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE c.challenged_id = $1 AND c.status = 'pending'`,
      [userId]
    );
    // Défis envoyés en attente
    const sent = await pool.query(
      `SELECT c.*, u.name as challenged_name, q.title as quiz_title
       FROM challenges c
       JOIN users u ON c.challenged_id = u.id
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE c.challenger_id = $1 AND c.status = 'pending'`,
      [userId]
    );
    res.json({ received: received.rows, sent: sent.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur récupération." });
  }
});

// PUT /api/challenges/:id/accept - Accepter un défi
router.put("/:id/accept", async (req, res) => {
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;

    const challenge = await pool.query(
      `SELECT * FROM challenges WHERE id = $1 AND challenged_id = $2 AND status = 'pending'`,
      [challengeId, userId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Défi non trouvé ou déjà traité." });
    }

    await pool.query(
      `UPDATE challenges SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [challengeId]
    );

    res.json({ message: "Défi accepté. Vous pouvez maintenant passer le quiz." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur acceptation." });
  }
});

// PUT /api/challenges/:id/decline - Refuser un défi
router.put("/:id/decline", async (req, res) => {
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;

    const result = await pool.query(
      `UPDATE challenges SET status = 'declined' WHERE id = $1 AND challenged_id = $2 AND status = 'pending' RETURNING id`,
      [challengeId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Défi non trouvé ou déjà traité." });
    }
    res.json({ message: "Défi refusé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur." });
  }
});

// POST /api/challenges/:id/start - Démarrer le quiz du défi (pour le joueur qui clique)
router.post("/:id/start", async (req, res) => {
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;

    // Vérifier que le défi est accepté et que l'utilisateur est participant
    const challenge = await pool.query(
      `SELECT * FROM challenges WHERE id = $1 AND status = 'accepted' AND (challenger_id = $2 OR challenged_id = $2)`,
      [challengeId, userId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Défi non trouvé ou non accepté." });
    }

    const quizId = challenge.rows[0].quiz_id;
    // Récupérer le quiz et générer les questions (identique à la route /quizzes/:id/start)
    // ... (réutiliser la logique de génération de questions depuis la banque)
    // Nous allons déporter cette logique dans une fonction helper pour éviter la duplication.

    // Pour le moment, nous redirigeons vers la route existante, mais en enregistrant le challenge_id dans la tentative.
    // Nous allons modifier la route /quizzes/:id/start pour accepter un paramètre optionnel challenge_id.

    // Solution simple : faire un appel interne à la logique de start en passant challenge_id.
    // Ici, je fournis une version adaptée directement.

    const quiz = await pool.query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
    const quizData = quiz.rows[0];
    const { group_id, chapter_id, difficulty_filter, question_count } = quizData;

    let query = "SELECT * FROM question_bank WHERE group_id = $1";
    const params = [group_id];
    if (chapter_id) { query += ` AND chapter_id = $${params.length+1}`; params.push(chapter_id); }
    if (difficulty_filter) { query += ` AND difficulty = $${params.length+1}`; params.push(difficulty_filter); }
    query += ` ORDER BY RANDOM() LIMIT $${params.length+1}`;
    params.push(question_count);

    const questionsResult = await pool.query(query, params);
    const questions = questionsResult.rows;

    if (questions.length === 0) {
      return res.status(404).json({ error: "Aucune question disponible." });
    }

    const questionsForStudent = questions.map(q => ({
      id: q.id,
      text: q.question_text,
      options: q.options,
    }));

    const attempt = await pool.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, started_at, challenge_id)
       VALUES ($1, $2, 0, $3, NOW(), $4) RETURNING id`,
      [userId, quizId, questions.length, challengeId]
    );

    res.json({
      attempt_id: attempt.rows[0].id,
      title: quizData.title,
      time_limit: quizData.time_limit,
      questions: questionsForStudent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur démarrage." });
  }
});

// POST /api/challenges/:id/submit - Soumettre les réponses pour un défi
router.post("/:id/submit", async (req, res) => {
  try {
    const userId = req.user.id;
    const challengeId = req.params.id;
    const { attempt_id, answers, time_spent } = req.body;

    // Vérifier que la tentative appartient bien à ce challenge et utilisateur
    const attemptCheck = await pool.query(
      `SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2 AND challenge_id = $3`,
      [attempt_id, userId, challengeId]
    );
    if (attemptCheck.rows.length === 0) {
      return res.status(400).json({ error: "Tentative invalide." });
    }

    const quizId = attemptCheck.rows[0].quiz_id;
    const quiz = await pool.query("SELECT * FROM quizzes WHERE id = $1", [quizId]);
    // Récupérer les questions de la banque pour correction
    // (nous devons les avoir stockées ou les récupérer via les ids de questions)
    // Simplification : nous allons récupérer les questions via la banque pour correction
    const questionIds = answers.map(a => a.questionId);
    const questionsData = await pool.query(
      "SELECT id, correct_option FROM question_bank WHERE id = ANY($1::int[])",
      [questionIds]
    );
    const correctMap = {};
    questionsData.rows.forEach(q => { correctMap[q.id] = q.correct_option; });

    let score = 0;
    answers.forEach(ans => {
      if (correctMap[ans.questionId] !== undefined && ans.selectedOption === correctMap[ans.questionId]) {
        score++;
      }
    });

    await pool.query(
      `UPDATE quiz_attempts SET score = $1, time_spent = $2, completed_at = NOW()
       WHERE id = $3`,
      [score, time_spent, attempt_id]
    );

    // Mettre à jour le challenge avec le score du joueur
    const challenge = await pool.query(
      "SELECT * FROM challenges WHERE id = $1",
      [challengeId]
    );
    const chal = challenge.rows[0];
    const isChallenger = (chal.challenger_id === userId);
    const updateField = isChallenger ? "challenger_score" : "challenged_score";
    const timeField = isChallenger ? "challenger_time" : "challenged_time";

    await pool.query(
      `UPDATE challenges SET ${updateField} = $1, ${timeField} = $2 WHERE id = $3`,
      [score, time_spent, challengeId]
    );

    // Vérifier si les deux ont soumis pour clôturer le challenge
    const updated = await pool.query(
      "SELECT * FROM challenges WHERE id = $1",
      [challengeId]
    );
    const c = updated.rows[0];
    if (c.challenger_score !== null && c.challenged_score !== null) {
      let winnerId = null;
      if (c.challenger_score > c.challenged_score) winnerId = c.challenger_id;
      else if (c.challenged_score > c.challenger_score) winnerId = c.challenged_id;
      else {
        // Égalité : comparer les temps
        if (c.challenger_time < c.challenged_time) winnerId = c.challenger_id;
        else if (c.challenged_time < c.challenger_time) winnerId = c.challenged_id;
      }
      await pool.query(
        `UPDATE challenges SET status = 'completed', completed_at = NOW(), winner_id = $1 WHERE id = $2`,
        [winnerId, challengeId]
      );
    }

    res.json({ score, total: questionIds.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur soumission." });
  }
});

// GET /api/challenges/:id/status - Voir l'état d'un défi (scores, gagnant)
router.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, 
        u1.name as challenger_name, 
        u2.name as challenged_name,
        q.title as quiz_title
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Défi non trouvé." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur." });
  }
});

// GET /api/challenges/leaderboard - Classement global des duels
router.get("/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, COUNT(c.id) as duels_won
       FROM users u
       LEFT JOIN challenges c ON u.id = c.winner_id
       WHERE c.status = 'completed'
       GROUP BY u.id
       ORDER BY duels_won DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur classement." });
  }
});

module.exports = router;