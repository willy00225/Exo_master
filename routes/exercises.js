const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const subscription = require("../middleware/subscription");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

// ----------------------
// ROUTES ÉLÈVES
// ----------------------

// GET /api/exercises/student/available – Exercices disponibles pour l'élève, groupés par chapitre
router.get("/student/available", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    // Récupérer les groupes de l'élève
    const userGroups = await pool.query(
      `SELECT g.id, g.name, g.subject, g.level 
       FROM groups g
       JOIN user_groups ug ON g.id = ug.group_id
       WHERE ug.user_id = $1`,
      [userId]
    );
    const groupIds = userGroups.rows.map(g => g.id);
    if (groupIds.length === 0) {
      return res.json({ groups: [], chapters: [] });
    }

    // Récupérer les chapitres de ces groupes
    const chapters = await pool.query(
      `SELECT c.id, c.title, c.group_id, g.name as group_name
       FROM chapters c
       JOIN groups g ON c.group_id = g.id
       WHERE c.group_id = ANY($1::int[])
       ORDER BY c.order_index ASC, c.created_at ASC`,
      [groupIds]
    );

    // Récupérer tous les exercices de ces groupes, avec leur chapitre d'appartenance
    const exercises = await pool.query(
      `SELECT e.*, 
              c.id as chapter_id, c.title as chapter_title,
              g.name as group_name, g.subject, g.level
       FROM exercises e
       LEFT JOIN chapters c ON e.chapter_id = c.id
       JOIN groups g ON e.group_id = g.id
       WHERE e.group_id = ANY($1::int[])
       ORDER BY 
         CASE e.difficulty
           WHEN 'easy' THEN 1
           WHEN 'medium' THEN 2
           WHEN 'hard' THEN 3
           WHEN 'very_hard' THEN 4
         END ASC,
         e.created_at ASC`,
      [groupIds]
    );

    // Grouper les exercices par chapitre
    const chaptersWithExercises = chapters.rows.map(chapter => {
      const chapterExercises = exercises.rows.filter(
        ex => ex.chapter_id === chapter.id
      );
      return {
        ...chapter,
        exercises: chapterExercises
      };
    });

    // Exercices sans chapitre (chapter_id NULL)
    const exercisesWithoutChapter = exercises.rows.filter(ex => ex.chapter_id === null);
    if (exercisesWithoutChapter.length > 0) {
      chaptersWithExercises.push({
        id: null,
        title: "Sans chapitre",
        group_id: null,
        group_name: null,
        exercises: exercisesWithoutChapter
      });
    }

    res.json({
      groups: userGroups.rows,
      chapters: chaptersWithExercises
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// GET /api/exercises/file/:filename - Télécharger un fichier protégé
router.get("/file/:filename", auth, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads/exercises", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier non trouvé." });
  }
  res.sendFile(filePath);
});

// 🆕 POST /api/exercises/:id/start-attempt – Démarrer une tentative de correction
router.post("/:id/start-attempt", auth, subscription, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'exercice est accessible (l'élève appartient au groupe de l'exercice)
    const access = await pool.query(
      `SELECT 1 FROM exercises e
       JOIN user_groups ug ON e.group_id = ug.group_id
       WHERE e.id = $1 AND ug.user_id = $2`,
      [id, userId]
    );
    if (access.rows.length === 0) {
      return res.status(403).json({ error: "Exercice non accessible." });
    }

    // Insérer une tentative (ou ignorer si déjà existante)
    await pool.query(
      "INSERT INTO exercise_attempts (user_id, exercise_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, id]
    );
    res.json({ started_at: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du démarrage de la tentative." });
  }
});

// 🆕 GET /api/exercises/:id/correction-status – Vérifier si le corrigé est disponible
router.get("/:id/correction-status", auth, subscription, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Récupérer la tentative la plus récente
    const attempt = await pool.query(
      "SELECT started_at FROM exercise_attempts WHERE user_id = $1 AND exercise_id = $2 ORDER BY started_at DESC LIMIT 1",
      [userId, id]
    );
    if (attempt.rows.length === 0) {
      return res.json({ canView: false, remainingSeconds: null, message: "Aucune tentative en cours." });
    }

    // Récupérer la difficulté de l'exercice
    const exercise = await pool.query("SELECT difficulty FROM exercises WHERE id = $1", [id]);
    if (exercise.rows.length === 0) {
      return res.status(404).json({ error: "Exercice introuvable." });
    }

    // Définir le temps minimum requis selon la difficulté
    const requiredMinutes = {
      easy: 5,
      medium: 10,
      hard: 15,
      very_hard: 20
    }[exercise.rows[0].difficulty] || 10;

    const started = new Date(attempt.rows[0].started_at);
    const now = new Date();
    const elapsedSeconds = (now - started) / 1000;
    const requiredSeconds = requiredMinutes * 60;

    if (elapsedSeconds >= requiredSeconds) {
      res.json({ canView: true, remainingSeconds: 0 });
    } else {
      const remaining = Math.ceil(requiredSeconds - elapsedSeconds);
      res.json({ canView: false, remainingSeconds: remaining });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la vérification." });
  }
});

// ----------------------
// ROUTES ADMIN
// ----------------------

// Middleware admin requis pour toutes les routes suivantes
router.use(auth);
router.use(admin);

// POST /api/exercises - Créer un exercice avec upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, description, difficulty, group_id, chapter_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Fichier requis." });
    }

    // Vérification cohérence chapter_id / group_id
    if (chapter_id) {
      const chapterCheck = await pool.query(
        "SELECT id FROM chapters WHERE id = $1 AND group_id = $2",
        [chapter_id, group_id]
      );
      if (chapterCheck.rows.length === 0) {
        return res.status(400).json({ error: "Le chapitre spécifié n'appartient pas à ce groupe." });
      }
    }

    const filePath = `/uploads/exercises/${file.filename}`;

    const newExercise = await pool.query(
      `INSERT INTO exercises (title, description, file_path, difficulty, group_id, chapter_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, filePath, difficulty, group_id, chapter_id || null]
    );

    res.status(201).json(newExercise.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de l'ajout de l'exercice." });
  }
});

// GET /api/exercises - Lister tous les exercices (admin) avec filtres optionnels
router.get("/", async (req, res) => {
  try {
    const { group_id, chapter_id, difficulty } = req.query;
    let query = "SELECT e.*, c.title as chapter_title FROM exercises e LEFT JOIN chapters c ON e.chapter_id = c.id";
    const params = [];
    const conditions = [];

    if (group_id) {
      conditions.push(`e.group_id = $${params.length + 1}`);
      params.push(group_id);
    }
    if (chapter_id) {
      conditions.push(`e.chapter_id = $${params.length + 1}`);
      params.push(chapter_id);
    }
    if (difficulty) {
      conditions.push(`e.difficulty = $${params.length + 1}`);
      params.push(difficulty);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY e.created_at DESC";

    const exercises = await pool.query(query, params);
    res.json(exercises.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des exercices." });
  }
});

// GET /api/exercises/:id - Détail d'un exercice (admin)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await pool.query(
      `SELECT e.*, c.title as chapter_title 
       FROM exercises e 
       LEFT JOIN chapters c ON e.chapter_id = c.id 
       WHERE e.id = $1`,
      [id]
    );
    if (exercise.rows.length === 0) {
      return res.status(404).json({ error: "Exercice non trouvé." });
    }
    res.json(exercise.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// PUT /api/exercises/:id - Modifier un exercice (admin)
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, group_id, chapter_id } = req.body;
    const file = req.file;

    // Récupérer l'ancien exercice
    const oldExercise = await pool.query("SELECT file_path, group_id FROM exercises WHERE id = $1", [id]);
    if (oldExercise.rows.length === 0) {
      return res.status(404).json({ error: "Exercice non trouvé." });
    }

    // Vérification chapitre/groupe si chapitre fourni
    if (chapter_id) {
      const targetGroupId = group_id || oldExercise.rows[0].group_id;
      const chapterCheck = await pool.query(
        "SELECT id FROM chapters WHERE id = $1 AND group_id = $2",
        [chapter_id, targetGroupId]
      );
      if (chapterCheck.rows.length === 0) {
        return res.status(400).json({ error: "Le chapitre spécifié n'appartient pas à ce groupe." });
      }
    }

    let filePath = oldExercise.rows[0].file_path;
    if (file) {
      // Supprimer l'ancien fichier physique
      const oldFilePath = path.join(__dirname, "..", oldExercise.rows[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      filePath = `/uploads/exercises/${file.filename}`;
    }

    const updated = await pool.query(
      `UPDATE exercises 
       SET title = $1, description = $2, difficulty = $3, group_id = $4, chapter_id = $5, file_path = $6
       WHERE id = $7 RETURNING *`,
      [title, description, difficulty, group_id, chapter_id || null, filePath, id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// DELETE /api/exercises/:id - Supprimer un exercice (admin)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const exercise = await pool.query("SELECT file_path FROM exercises WHERE id = $1", [id]);
    if (exercise.rows.length === 0) {
      return res.status(404).json({ error: "Exercice non trouvé." });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, "..", exercise.rows[0].file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query("DELETE FROM exercises WHERE id = $1", [id]);

    res.json({ message: "Exercice supprimé avec succès." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;