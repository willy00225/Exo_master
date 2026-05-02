const nodemailer = require('nodemailer');
const pool = require('./db');

// ---------- Configuration & Transporteur ----------
let transporter = null;
let configCache = null; // cache de la config email
let cacheTimestamp = 0;
const CACHE_TTL = 300000; // 5 minutes

/**
 * Récupère la configuration email depuis la table settings ou les variables d'env.
 * Utilise un cache pour éviter des requêtes SQL à chaque envoi.
 */
const getEmailConfig = async () => {
  const now = Date.now();
  if (configCache && (now - cacheTimestamp) < CACHE_TTL) {
    return configCache;
  }

  try {
    const result = await pool.query(
      "SELECT key, value FROM settings WHERE key IN ('smtp_host','smtp_port','smtp_user','smtp_pass')"
    );
    const settings = {};
    result.rows.forEach(r => settings[r.key] = r.value);

    configCache = {
      host: settings.smtp_host || process.env.SMTP_HOST,
      port: parseInt(settings.smtp_port || process.env.SMTP_PORT || '587', 10),
      user: settings.smtp_user || process.env.SMTP_USER,
      pass: settings.smtp_pass || process.env.SMTP_PASS,
    };
    cacheTimestamp = now;
    return configCache;
  } catch (err) {
    console.error('Erreur récupération config email :', err.message);
    return null;
  }
};

/**
 * Crée ou retourne le transporteur nodemailer.
 * Prend en compte le port 465 (SSL implicite) vs 587 (STARTTLS).
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const config = await getEmailConfig();
  if (!config || !config.host || !config.user || !config.pass) {
    console.warn('Configuration email manquante. Les emails ne seront pas envoyés.');
    return null;
  }

  const secure = config.port === 465; // true pour SSL, false pour STARTTLS
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 10000, // 10 secondes
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });

  // Vérification facultative de la connexion (une seule fois au démarrage)
  try {
    await transporter.verify();
    console.log('✅ Connexion au serveur email réussie.');
  } catch (err) {
    console.error('❌ Échec de la connexion au serveur email :', err.message);
    transporter = null;
  }

  return transporter;
};

// ---------- Envoi d'email (version de base, conservée) ----------
/**
 * Envoie un email.
 * @param {Object} options - { to, subject, html }
 * @returns {Promise<boolean>}
 */
const sendMail = async ({ to, subject, html }) => {
  try {
    const t = await getTransporter();
    if (!t) return false;

    const from = process.env.SMTP_FROM || 'no-reply@exomaster.com';
    await t.sendMail({ from, to, subject, html });
    console.log(`📧 Email envoyé à ${to} : "${subject}"`);
    return true;
  } catch (error) {
    console.error(`Erreur envoi email à ${to}:`, error.message);
    return false;
  }
};

// ---------- Envoi avec template simple (remplacement de variables) ----------
/**
 * Envoie un email en utilisant un template HTML avec variables.
 * @param {Object} options - { to, subject, template, variables }
 * @returns {Promise<boolean>}
 */
const sendTemplateMail = async ({ to, subject, template, variables }) => {
  let html = template;
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return sendMail({ to, subject, html });
};

// ---------- Emails prêts à l'emploi ----------
const sendWelcomeEmail = async (user) => {
  const html = `
    <h1>Bienvenue ${user.name} !</h1>
    <p>Votre compte EXO MASTER a été créé avec succès.</p>
    <p>Profitez de votre période d'essai gratuite.</p>
  `;
  return sendMail({ to: user.email, subject: 'Bienvenue sur EXO MASTER', html });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <h1>Réinitialisation de mot de passe</h1>
    <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
    <a href="${resetLink}">${resetLink}</a>
    <p>Ce lien expirera dans 1 heure.</p>
  `;
  return sendMail({ to: user.email, subject: 'Réinitialisation de votre mot de passe', html });
};

const sendPaymentConfirmation = async (user, amount) => {
  const html = `
    <h1>Paiement reçu</h1>
    <p>Nous avons bien reçu votre paiement de ${amount} FCFA.</p>
    <p>Votre abonnement est maintenant actif.</p>
  `;
  return sendMail({ to: user.email, subject: 'Confirmation de paiement', html });
};

const sendSubscriptionExpiryReminder = async (user, daysLeft) => {
  const html = `
    <h1>Votre abonnement expire bientôt</h1>
    <p>Bonjour ${user.name},</p>
    <p>Votre abonnement EXO MASTER expire dans ${daysLeft} jour(s).</p>
    <p>Pensez à le renouveler pour continuer à profiter de la plateforme.</p>
  `;
  return sendMail({ to: user.email, subject: 'Abonnement expirant', html });
};

// ---------- Mode test (optionnel) ----------
/**
 * Active un transporteur de test (Ethereal) pour intercepter les emails en développement.
 * Appeler cette fonction au démarrage du serveur si EMAIL_TEST_MODE=true.
 */
const enableTestMode = async () => {
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  console.log('📭 Mode test email activé (Ethereal). Les emails ne seront pas réellement envoyés.');
};

// Vérification de la variable d'environnement pour activer le mode test
if (process.env.EMAIL_TEST_MODE === 'true') {
  enableTestMode();
}

module.exports = {
  sendMail,
  sendTemplateMail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmation,
  sendSubscriptionExpiryReminder,
  getTransporter, // exporté pour diagnostic éventuel
};