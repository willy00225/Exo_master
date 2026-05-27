const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const auth = require("../middleware/auth");
const { sendMail, sendPasswordResetEmail, sendVerificationEmail } = require("../config/mailer");

// ------------------------------------------------------------
// 📝 INSCRIPTION avec envoi d'email de vérification
// ------------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, group_id } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Cet email est déjà utilisé." });
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Adresse email invalide." });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Générer un token de vérification
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insérer le nouvel utilisateur
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, verification_token, subscription_expires)
       VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, "student", verificationToken]
    );

    // Assigner au groupe si demandé
    if (group_id) {
      await pool.query(
        "INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [newUser.rows[0].id, group_id]
      );
    }

    // 📧 LOG : Avant envoi
    console.log(`📧 [VERIF] Début envoi vérification pour ${email} (token: ${verificationToken.substring(0,10)}...)`);

    // Envoyer l'email de vérification (ne bloque pas l'inscription en cas d'échec)
    try {
      await sendVerificationEmail(newUser.rows[0], verificationToken);
      // ✅ LOG : Succès
      console.log(`✅ [VERIF] Email de vérification envoyé à ${email}`);
    } catch (mailErr) {
      // ❌ LOG : Échec
      console.error(`❌ [VERIF] Échec envoi vérification à ${email}:`, mailErr.message);
      // L'inscription continue même sans l'email
    }

    // Générer un token JWT pour l'authentification immédiate
    const token = jwt.sign(
      { id: newUser.rows[0].id, email: newUser.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      user: newUser.rows[0],
      token,
      message: "Inscription réussie. Un email de vérification a été envoyé."
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
});

// ------------------------------------------------------------
// 📧 Vérification de l'email (avec expiration 24h)
// ------------------------------------------------------------
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token manquant." });

    const user = await pool.query(
      "SELECT id, created_at FROM users WHERE verification_token = $1",
      [token]
    );
    if (user.rows.length === 0) {
      // Rediriger avec un message d'erreur
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/email-verified?error=invalid`);
    }

    // Vérifier si le lien a expiré (24h après création du compte)
    const createdAt = new Date(user.rows[0].created_at);
    const now = new Date();
    const diffHours = (now - createdAt) / (1000 * 60 * 60);
    if (diffHours > 24) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/email-verified?error=expired`);
    }

    await pool.query("UPDATE users SET email_verified = true, verification_token = NULL WHERE id = $1", [user.rows[0].id]);

    // Rediriger vers la page de succès
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/email-verified?success=true`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ------------------------------------------------------------
// 🔐 CONNEXION (login) – Vérification d'email activée
// ------------------------------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }

    if (!user.rows[0].email_verified) {
      return res.status(403).json({
        error: "Email non vérifié. Veuillez consulter votre boîte mail.",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const { password: _, ...userWithoutPassword } = user.rows[0];
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de la connexion." });
  }
});

// ------------------------------------------------------------
// 📧 RENVOYER L'EMAIL DE VÉRIFICATION
// ------------------------------------------------------------
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis." });

    const user = await pool.query("SELECT id, name, email, email_verified FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.json({ message: "Si un compte existe avec cet email, un nouveau lien de vérification a été envoyé." });
    }

    if (user.rows[0].email_verified) {
      return res.status(400).json({ error: "Cet email est déjà vérifié." });
    }

    const newToken = crypto.randomBytes(32).toString('hex');
    await pool.query("UPDATE users SET verification_token = $1 WHERE id = $2", [newToken, user.rows[0].id]);

    await sendVerificationEmail(user.rows[0], newToken);

    res.json({ message: "Un nouveau lien de vérification a été envoyé à votre adresse email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de l'envoi du lien." });
  }
});

// ------------------------------------------------------------
// 📧 MOT DE PASSE OUBLIÉ – Demander un lien de réinitialisation
// ------------------------------------------------------------
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query("SELECT id, name, email FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000);

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [token, expiresAt, user.rows[0].id]
    );

    await sendPasswordResetEmail(user.rows[0], token);

    res.json({ message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email." });
  }
});

// ------------------------------------------------------------
// 🔄 RÉINITIALISER LE MOT DE PASSE avec le token reçu
// ------------------------------------------------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await pool.query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
      [token]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Token invalide ou expiré." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hashedPassword, user.rows[0].id]
    );

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Erreur lors de la réinitialisation du mot de passe." });
  }
});

// ------------------------------------------------------------
// 🔒 CHANGER LE MOT DE PASSE (utilisateur connecté)
// ------------------------------------------------------------
router.put("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    if (user.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });

    const valid = await bcrypt.compare(oldPassword, user.rows[0].password);
    if (!valid) return res.status(400).json({ error: "Ancien mot de passe incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashed, req.user.id]);

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;