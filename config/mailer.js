const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'Exo Master <willyblack369@gmail.com>';

  if (!host || !port || !user || !pass) {
    console.error('❌ Configuration SMTP incomplète. Vérifiez SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true pour 465, false pour autres
      auth: { user, pass },
    });
    console.log(`✅ Transporteur SMTP initialisé avec ${host}:${port}`);
    return transporter;
  } catch (err) {
    console.error('❌ Erreur création transporteur SMTP:', err.message);
    return null;
  }
};

const sendMail = async ({ to, subject, html }) => {
  console.log(`📧 Tentative d'envoi à ${to} via SMTP ${process.env.SMTP_HOST || 'inconnu'}`);
  
  const t = await getTransporter();
  if (!t) {
    console.error('❌ Transporteur non initialisé');
    return false;
  }
  
  try {
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || 'Exo Master <willyblack369@gmail.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email envoyé avec succès à ${to} (Message ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message);
    if (err.response) console.error('Détails:', err.response);
    return false;
  }
};

const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'https://exo-master.com'}/reset-password?token=${token}`;
  console.log(`🔐 Envoi email réinitialisation pour ${user.email}`);
  return await sendMail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe - EXO MASTER',
    html: `<h1>Réinitialisation de votre mot de passe</h1>
           <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>Ce lien expirera dans 1 heure.</p>
           <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>`
  });
};

module.exports = { sendMail, sendPasswordResetEmail };