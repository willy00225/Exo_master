const pool = require("../config/db");

module.exports = async function (req, res, next) {
  // req.user doit être défini par le middleware auth
  if (!req.user) {
    return res.status(401).json({ error: "Non authentifié." });
  }

  try {
    const user = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (user.rows.length === 0 || user.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Accès réservé à l'administrateur." });
    }

    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
};