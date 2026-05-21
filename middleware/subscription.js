const pool = require("../config/db");

/**
 * Middleware pour vérifier que l'utilisateur a un abonnement actif.
 * À utiliser après le middleware 'auth'.
 * Ignore les utilisateurs qui ne sont pas des étudiants (admin, etc.).
 */
module.exports = async function (req, res, next) {
  const userId = req.user.id;

  try {
    // Récupérer le rôle et la date d'expiration
    const user = await pool.query(
      "SELECT role, subscription_expires FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Si l'utilisateur n'est pas un étudiant, on laisse passer (admin, etc.)
    if (user.rows[0].role !== 'student') {
      return next();
    }

    const expires = user.rows[0].subscription_expires;

    console.log(`[Subscription] userId=${userId}, expires=${expires}, now=${new Date().toISOString()}`);

    if (!expires || new Date(expires) < new Date()) {
      console.log(`[Subscription] BLOCKED`);
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