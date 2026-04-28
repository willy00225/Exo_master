const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

// ----------------------
// ROUTES ÉLÈVES (accessibles avec auth uniquement)
// ----------------------

// GET /api/exercises/student/available - Exercices disponibles pour l'élève connecté, groupés par chapitre
router.get("/student/available", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Récupérer les groupes de l'utilisateur
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

    // 2. Récupérer les chapitres de ces groupes
    const chapters = await pool.query(
      `SELECT c.id, c.title, c.group_id, g.name as group_name
       FROM chapters c
       JOIN groups g ON c.group_id = g.id
       WHERE c.group_id = ANY($1::int[])
       ORDER BY c.order_index ASC, c.created_at ASC`,
      [groupIds]
    );

    // 3. Récupérer tous les exercices de ces groupes, avec leur chapter_id
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

    // 4. Grouper les exercices par chapitre
    const chaptersWithExercises = chapters.rows.map(chapter => {
      const chapterExercises = exercises.rows.filter(
        ex => ex.chapter_id === chapter.id
      );
      return {
        ...chapter,
        exercises: chapterExercises
      };
    });

    // Ajouter les exercices sans chapitre (chapter_id NULL) dans un groupe "Sans chapitre"
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

// GET /api/exercises/file/:filename - Télécharger un fichier (protégé par auth)
router.get("/file/:filename", auth, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads/exercises", filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier non trouvé." });
  }

  res.sendFile(filePath);
});

// ----------------------
// ROUTES ADMIN (protégées par auth + admin)
// ----------------------

// Middleware admin requis pour toutes les routes suivantes
router.use(auth);
router.use(admin);

// POST /api/exercises - Créer un exercice avec upload et chapter_id
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, description, difficulty, group_id, chapter_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Fichier requis." });
    }

    // Vérification que le chapter_id (s'il est fourni) appartient bien au group_id
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

// GET /api/exercises - Lister tous les exercices (admin)
router.get("/", async (req, res) => {
  try {
    const { group_id, chapter_id } = req.query;
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

// GET /api/exercises/:id - Détail d'un exercice
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

// PUT /api/exercises/:id - Modifier un exercice (avec possibilité de changer le fichier et chapter_id)
router.put("/:id", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, group_id, chapter_id } = req.body;
    const file = req.file;

    // Récupérer l'ancien exercice pour supprimer l'ancien fichier si nécessaire
    const oldExercise = await pool.query("SELECT file_path, group_id FROM exercises WHERE id = $1", [id]);
    if (oldExercise.rows.length === 0) {
      return res.status(404).json({ error: "Exercice non trouvé." });
    }

    // Vérification cohérence chapter_id / group_id si chapter_id fourni
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
      // Supprimer l'ancien fichier
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

// DELETE /api/exercises/:id - Supprimer un exercice
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