const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const subscription = require("../middleware/subscription");
const presence = require("../middleware/presence"); // 🆕 middleware de présence

// Appliquer auth, présence et subscription à toutes les routes de ce routeur
router.use(auth);
router.use(presence);
router.use(subscription);

// ------------------------------------------------------------------
// GET /api/challenges/pending – Défis reçus et envoyés en cours
// ------------------------------------------------------------------
router.get("/pending", async (req, res) => {
  try {
    const userId = req.user.id;

    // Défis reçus
    const received = await pool.query(
      `SELECT c.id, c.challenger_id, c.challenged_id, c.quiz_id, c.status,
              u.name AS challenger_name, q.title AS quiz_title,
              CASE WHEN c.challenged_id = $1 THEN true ELSE false END AS has_played
       FROM challenges c
       JOIN users u ON c.challenger_id = u.id
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE c.challenged_id = $1
         AND c.status IN ('pending', 'accepted')
         AND c.winner_id IS NULL
       ORDER BY c.created_at DESC`,
      [userId]
    );

    // Défis envoyés
    const sent = await pool.query(
      `SELECT c.id, c.challenger_id, c.challenged_id, c.quiz_id, c.status,
              u.name AS challenged_name, q.title AS quiz_title,
              CASE WHEN c.challenger_id = $1 THEN true ELSE false END AS has_played
       FROM challenges c
       JOIN users u ON c.challenged_id = u.id
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE c.challenger_id = $1
         AND c.status IN ('pending', 'accepted')
         AND c.winner_id IS NULL
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({
      received: received.rows,
      sent: sent.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des défis." });
  }
});

// ------------------------------------------------------------------
// GET /api/challenges/history – Historique des défis terminés
// ------------------------------------------------------------------
router.get("/history", async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT c.id, c.challenger_id, c.challenged_id, c.quiz_id,
              c.challenger_score, c.challenged_score, c.winner_id,
              u1.name AS challenger_name, u2.name AS challenged_name,
              q.title AS quiz_title
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       JOIN users u2 ON c.challenged_id = u2.id
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE (c.challenger_id = $1 OR c.challenged_id = $1)
         AND c.winner_id IS NOT NULL
       ORDER BY c.completed_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique." });
  }
});

// ------------------------------------------------------------------
// POST /api/challenges – Créer un défi (avec vérification anti-doublon)
// ------------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const { challenged_id, quiz_id } = req.body;

    // Vérifier que le destinataire n'a pas déjà un challenge en cours
    const existingChallenge = await pool.query(
      `SELECT id FROM challenges
       WHERE challenged_id = $1
         AND winner_id IS NULL
         AND status NOT IN ('declined', 'completed')
       LIMIT 1`,
      [challenged_id]
    );

    if (existingChallenge.rows.length > 0) {
      const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [challenged_id]);
      const name = userRes.rows[0]?.name || "Cet élève";
      return res.status(400).json({ error: `${name} a déjà un challenge en cours.` });
    }

    // Créer le challenge
    const result = await pool.query(
      `INSERT INTO challenges (challenger_id, challenged_id, quiz_id, status)
       VALUES ($1, $2, $3, 'pending') RETURNING *`,
      [req.user.id, challenged_id, quiz_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création du défi." });
  }
});

// ------------------------------------------------------------------
// GET /api/challenges/available-opponents – Adversaires avec pagination
// ------------------------------------------------------------------
router.get("/available-opponents", async (req, res) => {
  try {
    const userId = req.user.id;
    const { subject_id, chapter_id, page = 1, limit = 10, search = '' } = req.query;

    // Récupérer le groupe de l'utilisateur
    const userGroup = await pool.query(
      `SELECT group_id FROM user_groups WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (userGroup.rows.length === 0) {
      return res.json({ opponents: [], total: 0, page: 1, totalPages: 0 });
    }

    const groupId = userGroup.rows[0].group_id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Requête de base
    let query = `
      SELECT u.id, u.name, u.last_seen,
             (u.last_seen > NOW() - INTERVAL '5 minutes') AS is_online
      FROM users u
      JOIN user_groups ug ON u.id = ug.user_id
      WHERE ug.group_id = $1
        AND u.id <> $2
        AND u.role = 'student'
    `;
    const params = [groupId, userId];

    // Filtres matière/chapitre (via les quiz disponibles)
    if (subject_id) {
      query += ` AND EXISTS (
        SELECT 1 FROM quizzes q
        WHERE q.group_id = $1 AND q.subject_id = $${params.length + 1}
          AND ($3::int IS NULL OR q.chapter_id = $3)
      )`;
      params.push(subject_id, chapter_id || null);
    }

    if (search.trim()) {
      query += ` AND u.name ILIKE $${params.length + 1}`;
      params.push(`%${search.trim()}%`);
    }

    // Compter le total
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS total`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    query += ` ORDER BY is_online DESC, u.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const opponents = await pool.query(query, params);

    res.json({
      opponents: opponents.rows,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des adversaires." });
  }
});

// ------------------------------------------------------------------
// POST /api/challenges/:id/accept – Accepter un défi
// ------------------------------------------------------------------
router.put("/:id/accept", async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    const challenge = await pool.query(
      `SELECT * FROM challenges WHERE id = $1 AND challenged_id = $2`,
      [challengeId, userId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }

    await pool.query(
      `UPDATE challenges SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [challengeId]
    );
    res.json({ message: "Défi accepté." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'acceptation." });
  }
});

// ------------------------------------------------------------------
// PUT /api/challenges/:id/decline – Refuser un défi
// ------------------------------------------------------------------
router.put("/:id/decline", async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    const challenge = await pool.query(
      `SELECT * FROM challenges WHERE id = $1 AND challenged_id = $2`,
      [challengeId, userId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }

    await pool.query(
      `UPDATE challenges SET status = 'declined' WHERE id = $1`,
      [challengeId]
    );
    res.json({ message: "Défi refusé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du refus." });
  }
});

// ------------------------------------------------------------------
// POST /api/challenges/:id/start – Démarrer le quiz d'un challenge
// ------------------------------------------------------------------
router.post("/:id/start", async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;

    const challenge = await pool.query(
      `SELECT c.*, q.title, q.difficulty_filter, q.question_count, q.time_limit
       FROM challenges c
       JOIN quizzes q ON c.quiz_id = q.id
       WHERE c.id = $1
         AND (c.challenger_id = $2 OR c.challenged_id = $2)`,
      [challengeId, userId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }

    const challengeData = challenge.rows[0];

    // Récupérer les questions liées au quiz via la table de liaison
    const questionsResult = await pool.query(
      `SELECT qb.*
       FROM question_bank qb
       JOIN quiz_questions qq ON qb.id = qq.question_id
       WHERE qq.quiz_id = $1
       ORDER BY qq.question_id
       LIMIT $2`,
      [challengeData.quiz_id, challengeData.question_count]
    );
    const questions = questionsResult.rows;

    if (questions.length === 0) {
      return res.status(404).json({ error: "Aucune question disponible." });
    }

    const questionsForStudent = questions.map(q => ({
      id: q.id,
      text: q.question_text,
      options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? q.options.split(' ').filter(Boolean) : []),
    }));

    // Créer une tentative (stockée dans quiz_attempts, mais on pourrait aussi utiliser challenge_attempts)
    const attempt = await pool.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, score, total_questions, started_at, questions)
       VALUES ($1, $2, 0, $3, NOW(), $4) RETURNING id`,
      [userId, challengeData.quiz_id, questions.length, JSON.stringify(questions)]
    );

    res.json({
      attempt_id: attempt.rows[0].id,
      title: challengeData.title,
      time_limit: challengeData.time_limit,
      questions: questionsForStudent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du démarrage du challenge." });
  }
});

// ------------------------------------------------------------------
// POST /api/challenges/:id/submit – Soumettre le score d'un challenge
// ------------------------------------------------------------------
router.post("/:id/submit", async (req, res) => {
  try {
    const challengeId = req.params.id;
    const userId = req.user.id;
    const { attempt_id, answers, time_spent } = req.body;

    const challenge = await pool.query(
      `SELECT * FROM challenges WHERE id = $1
         AND (challenger_id = $2 OR challenged_id = $2)`,
      [challengeId, userId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }

    // Récupérer la tentative (quiz_attempts) pour obtenir les questions
    const attempt = await pool.query(
      `SELECT * FROM quiz_attempts WHERE id = $1 AND user_id = $2`,
      [attempt_id, userId]
    );
    if (attempt.rows.length === 0) {
      return res.status(404).json({ error: "Tentative introuvable." });
    }

    const questions = attempt.rows[0].questions;

    // Calculer le score
    const parseNumeric = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') return Number(val.replace(',', '.'));
      return NaN;
    };

    let score = 0;
    questions.forEach((q) => {
      const userAnswer = answers.find(a => a.questionId === q.id);
      const selectedOption = userAnswer ? userAnswer.selectedOption : null;
      const correctIndex = q.correct_option;

      let correct = (selectedOption === correctIndex);
      if (!correct && selectedOption !== null && selectedOption !== undefined) {
        const correctValue = parseNumeric(q.options[correctIndex]);
        const selectedValue = parseNumeric(q.options[selectedOption]);
        if (!isNaN(correctValue) && !isNaN(selectedValue)) {
          correct = correctValue === selectedValue;
        }
      }
      if (correct) score++;
    });

    // Mettre à jour la tentative
    await pool.query(
      `UPDATE quiz_attempts SET score = $1, time_spent = $2, completed_at = NOW() WHERE id = $3`,
      [score, time_spent, attempt_id]
    );

    // Enregistrer le score dans le challenge
    if (userId === challenge.rows[0].challenger_id) {
      await pool.query(
        `UPDATE challenges SET challenger_score = $1, challenger_time = $2 WHERE id = $3`,
        [score, time_spent, challengeId]
      );
    } else {
      await pool.query(
        `UPDATE challenges SET challenged_score = $1, challenged_time = $2 WHERE id = $3`,
        [score, time_spent, challengeId]
      );
    }

    // Vérifier si les deux ont joué pour terminer le challenge
    const updated = await pool.query(`SELECT * FROM challenges WHERE id = $1`, [challengeId]);
    const chal = updated.rows[0];
    if (chal.challenger_score !== null && chal.challenged_score !== null) {
      // Déterminer le gagnant
      let winner_id = null;
      if (chal.challenger_score > chal.challenged_score) {
        winner_id = chal.challenger_id;
      } else if (chal.challenged_score > chal.challenger_score) {
        winner_id = chal.challenged_id;
      }
      // Mettre à jour le challenge comme terminé
      await pool.query(
        `UPDATE challenges SET winner_id = $1, status = 'completed', completed_at = NOW() WHERE id = $2`,
        [winner_id, challengeId]
      );
    }

    // Retourner les corrections (à adapter selon votre logique)
    res.json({
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      corrections: questions.map(q => ({
        questionId: q.id,
        text: q.question_text,
        options: q.options,
        correctOption: q.correct_option,
        selectedOption: answers.find(a => a.questionId === q.id)?.selectedOption,
        isCorrect: (answers.find(a => a.questionId === q.id)?.selectedOption === q.correct_option),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la soumission." });
  }
});

// ------------------------------------------------------------------
// GET /api/challenges/:id/status – Statut du challenge
// ------------------------------------------------------------------
router.get("/:id/status", async (req, res) => {
  try {
    const challengeId = req.params.id;
    const result = await pool.query(
      `SELECT * FROM challenges WHERE id = $1`,
      [challengeId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération du statut." });
  }
});

// ------------------------------------------------------------------
// 💬 Messagerie d'un challenge
// ------------------------------------------------------------------

// GET /api/challenges/:challengeId/messages
router.get("/:challengeId/messages", async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await pool.query(
      `SELECT challenger_id, challenged_id FROM challenges WHERE id = $1`,
      [challengeId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }
    const { challenger_id, challenged_id } = challenge.rows[0];
    if (userId !== challenger_id && userId !== challenged_id) {
      return res.status(403).json({ error: "Vous ne participez pas à ce challenge." });
    }

    const result = await pool.query(
      `SELECT cm.id, cm.sender_id, u.name AS sender_name, cm.message, cm.created_at
       FROM challenge_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.challenge_id = $1
       ORDER BY cm.created_at ASC`,
      [challengeId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des messages." });
  }
});

// POST /api/challenges/:challengeId/messages
router.post("/:challengeId/messages", async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "Le message ne peut pas être vide." });
    }

    const challenge = await pool.query(
      `SELECT challenger_id, challenged_id FROM challenges WHERE id = $1`,
      [challengeId]
    );
    if (challenge.rows.length === 0) {
      return res.status(404).json({ error: "Challenge non trouvé." });
    }
    const { challenger_id, challenged_id } = challenge.rows[0];
    if (userId !== challenger_id && userId !== challenged_id) {
      return res.status(403).json({ error: "Vous ne participez pas à ce challenge." });
    }

    const result = await pool.query(
      `INSERT INTO challenge_messages (challenge_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, challenge_id, sender_id, message, created_at`,
      [challengeId, userId, message.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi du message." });
  }
});

module.exports = router;