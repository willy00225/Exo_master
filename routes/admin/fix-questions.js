const express = require("express");
const router = express.Router();
const pool = require("../../config/db");
const auth = require("../../middleware/auth");
const admin = require("../../middleware/admin");

router.use(auth);
router.use(admin);

// POST /api/admin/fix-questions – corrige les QCM mathématiques en base
router.post("/", async (req, res) => {
  try {
    // Récupère toutes les questions
    const allQuestions = await pool.query("SELECT id, question_text, options, correct_option FROM question_bank");
    let fixed = 0;

    for (const q of allQuestions.rows) {
      const text = q.question_text;
      const options = q.options; // tableau JSON

      // Cherche un calcul dans l'énoncé (ex: "1,9 + 2,1")
      const match = text.match(/(\d+[\.,]?\d*)\s*([+\-])\s*(\d+[\.,]?\d*)/);
      if (!match) continue;

      const a = parseFloat(match[1].replace(',', '.'));
      const op = match[2];
      const b = parseFloat(match[3].replace(',', '.'));
      let result;
      if (op === '+') result = a + b;
      else if (op === '-') result = a - b;
      else continue;

      // Cherche l'option dont la valeur numérique correspond (tolérance 0.001)
      const correctIndex = options.findIndex(opt => {
        const val = parseFloat(String(opt).replace(',', '.'));
        return Math.abs(val - result) < 0.001;
      });

      if (correctIndex !== -1 && correctIndex !== q.correct_option) {
        await pool.query("UPDATE question_bank SET correct_option = $1 WHERE id = $2", [correctIndex, q.id]);
        fixed++;
      }
    }

    res.json({ message: `${fixed} question(s) corrigée(s) sur ${allQuestions.rows.length}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la correction." });
  }
});

module.exports = router;