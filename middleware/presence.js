// middleware/presence.js
const pool = require("../config/db");

module.exports = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      await pool.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [req.user.id]);
    }
  } catch (err) {
    console.error("Erreur mise à jour présence:", err);
  }
  next();
};