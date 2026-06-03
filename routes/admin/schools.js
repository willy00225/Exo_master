const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// GET /api/admin/schools
router.get("/", async (req, res) => {
  try {
    const schools = await pool.query(`
      SELECT s.*, 
             COALESCE(json_agg(json_build_object('id', g.id, 'name', g.name)) FILTER (WHERE g.id IS NOT NULL), '[]') AS groups
      FROM schools s
      LEFT JOIN school_groups sg ON s.id = sg.school_id
      LEFT JOIN groups g ON sg.group_id = g.id
      GROUP BY s.id
      ORDER BY s.name
    `);
    res.json(schools.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chargement des écoles." });
  }
});

// POST /api/admin/schools
router.post("/", async (req, res) => {
  const { name, code, max_students, group_ids } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO schools (name, code, max_students) VALUES ($1, $2, $3) RETURNING id",
      [name, code, max_students || null]
    );
    const schoolId = result.rows[0].id;
    if (group_ids && group_ids.length > 0) {
      for (const gid of group_ids) {
        await pool.query("INSERT INTO school_groups (school_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [schoolId, gid]);
      }
    }
    res.status(201).json({ message: "École créée avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la création de l'école." });
  }
});

// PUT /api/admin/schools/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, code, max_students, group_ids } = req.body;
  try {
    await pool.query(
      "UPDATE schools SET name=$1, code=$2, max_students=$3 WHERE id=$4",
      [name, code, max_students || null, id]
    );
    await pool.query("DELETE FROM school_groups WHERE school_id=$1", [id]);
    if (group_ids && group_ids.length > 0) {
      for (const gid of group_ids) {
        await pool.query("INSERT INTO school_groups (school_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, gid]);
      }
    }
    res.json({ message: "École mise à jour." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour." });
  }
});

// DELETE /api/admin/schools/:id
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM schools WHERE id=$1", [req.params.id]);
    res.json({ message: "École supprimée." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;