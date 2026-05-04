const pool = require("../config/db");

module.exports = async function (req, res, next) {
  try {
    const user = await pool.query("SELECT email_verified FROM users WHERE id = $1", [req.user.id]);
    if (!user.rows[0]?.email_verified) {
      return res.status(403).json({ error: "Veuillez vérifier votre adresse email." });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};