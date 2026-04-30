const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 📝 INSCRIPTION (version complète et sécurisée)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Vérifier si l'email existe déjà
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    // 2. Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Insérer le nouvel utilisateur (rôle par défaut 'student')
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at",
      [name, email, hashedPassword, "student"]
    );

    // Si un group_id est envoyé, on affecte directement l'élève
    if (req.body.group_id) {
      await pool.query(
        "INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [newUser.rows[0].id, req.body.group_id]
      );
    }

    // 4. Récupérer la durée d'essai depuis la table settings (par défaut 7 jours)
    let trialDays = 7;
    try {
      const setting = await pool.query("SELECT value FROM settings WHERE key = 'trial_days'");
      if (setting.rows.length > 0) trialDays = parseInt(setting.rows[0].value) || 7;
    } catch (e) {
      // En cas d'erreur (table inexistante, etc.), on garde 7 jours
    }

    // Définir la date d'expiration de l'essai
    await pool.query(
      "UPDATE users SET subscription_expires = NOW() + INTERVAL '1 day' * $1 WHERE id = $2",
      [trialDays, newUser.rows[0].id]
    );

    // 5. Générer un token JWT
    const token = jwt.sign(
      {
        id: newUser.rows[0].id,
        email: newUser.rows[0].email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      user: newUser.rows[0],
      token,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
});

// 🔐 CONNEXION (login)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Vérifier si l'utilisateur existe
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    // 2. Comparer le mot de passe
    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    // 3. Générer un token JWT
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 4. Retourner les informations utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user.rows[0];

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de la connexion.", details: error.message });
  }
});

module.exports = router;