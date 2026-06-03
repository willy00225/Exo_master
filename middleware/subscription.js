const pool = require("../config/db");

module.exports = async function (req, res, next) {
  const userId = req.user.id;

  try {
    const user = await pool.query(
      "SELECT role, subscription_expires, school_id FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Si l'utilisateur n'est pas un étudiant, on laisse passer (admin, etc.)
    if (user.rows[0].role !== 'student') {
      return next();
    }

    let expires = user.rows[0].subscription_expires;

    // Si l'élève a un abonnement individuel actif, c'est bon
    if (expires && new Date(expires) >= new Date()) {
      return next();
    }

    // Sinon, vérifier si l'école partenaire a un abonnement actif
    const schoolId = user.rows[0].school_id;
    if (schoolId) {
      const school = await pool.query(
        "SELECT subscription_expires FROM schools WHERE id = $1",
        [schoolId]
      );
      if (school.rows.length > 0 && school.rows[0].subscription_expires && new Date(school.rows[0].subscription_expires) >= new Date()) {
        return next(); // L'école a un abonnement actif
      }
    }

    // Aucun abonnement valide
    return res.status(403).json({
      error: "Abonnement expiré ou inexistant. Veuillez souscrire un abonnement.",
    });
  } catch (err) {
    console.error("Erreur middleware subscription:", err.message);
    res.status(500).json({ error: "Erreur serveur lors de la vérification de l'abonnement." });
  }
};