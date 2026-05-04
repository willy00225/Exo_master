const { Resend } = require('resend');
const pool = require('./db');

let resend = null;

/**
 * Récupère l'instance Resend configurée avec la clé API
 */
const getResend = async () => {
  if (resend) return resend;

  // Récupère la clé depuis la table settings ou la variable d'environnement
  const result = await pool.query("SELECT value FROM settings WHERE key = 'resend_api_key'");
  const apiKey = result.rows[0]?.value || process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('Clé API Resend manquante. Les emails ne seront pas envoyés.');
    return null;
  }

  resend = new Resend(apiKey);
  return resend;
};

/**
 * Récupère l'adresse d'expédition configurée
 */
const getFromAddress = async () => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'smtp_from'");
    return result.rows[0]?.value || process.env.SMTP_FROM || 'onboarding@resend.dev';
  } catch {
    return process.env.SMTP_FROM || 'onboarding@resend.dev';
  }
};

/**
 * Envoie un email (fonction de base)
 */
const sendMail = async ({ to, subject, html }) => {
  const r = await getResend();
  if (!r) return false;

  const from = await getFromAddress();

  try {
    await r.emails.send({ from, to, subject, html });
    console.log(`📧 Email envoyé à ${to} : "${subject}"`);
    return true;
  } catch (err) {
    console.error(`Erreur Resend à ${to}:`, err.message);
    return false;
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 * (utilisé par routes/auth.js pour le mot de passe oublié)
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const html = `
    <h1>Réinitialisation de mot de passe</h1>
    <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>Ce lien expirera dans 1 heure.</p>
  `;
  return sendMail({ to: user.email, subject: 'Réinitialisation de votre mot de passe', html });
};

/**
 * Envoie un email de bienvenue (optionnel)
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <h1>Bienvenue ${user.name} !</h1>
    <p>Votre compte EXO MASTER a été créé avec succès.</p>
    <p>Profitez de votre période d'essai gratuite.</p>
  `;
  return sendMail({ to: user.email, subject: 'Bienvenue sur EXO MASTER', html });
};

/**
 * Envoie une confirmation de paiement (optionnel)
 */
const sendPaymentConfirmation = async (user, amount) => {
  const html = `
    <h1>Paiement reçu</h1>
    <p>Nous avons bien reçu votre paiement de ${amount} FCFA.</p>
    <p>Votre abonnement est maintenant actif.</p>
  `;
  return sendMail({ to: user.email, subject: 'Confirmation de paiement', html });
};

/**
 * Rappel d'expiration d'abonnement (optionnel)
 */
const sendSubscriptionExpiryReminder = async (user, daysLeft) => {
  const html = `
    <h1>Votre abonnement expire bientôt</h1>
    <p>Bonjour ${user.name},</p>
    <p>Votre abonnement EXO MASTER expire dans ${daysLeft} jour(s).</p>
    <p>Pensez à le renouveler pour continuer à profiter de la plateforme.</p>
  `;
  return sendMail({ to: user.email, subject: 'Abonnement expirant', html });
};

module.exports = {
  sendMail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendPaymentConfirmation,
  sendSubscriptionExpiryReminder,
};