const pool = require("../config/db");

/**
 * Middleware pour vérifier que l'utilisateur a un abonnement actif.
 * À utiliser après le middleware 'auth'.
 */
module.exports = async function (req, res, next) {
  const userId = req.user.id;

  try {
    const user = await pool.query(
      "SELECT subscription_expires FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const expires = user.rows[0].subscription_expires;

    if (!expires || new Date(expires) < new Date()) {
      return res.status(403).json({
        error: "Abonnement expiré ou inexistant. Veuillez souscrire un abonnement.",
      });
    }

    next();
  } catch (err) {
    console.error("Erreur middleware subscription:", err.message);
    res.status(500).json({ error: "Erreur serveur lors de la vérification de l'abonnement." });
  }
};