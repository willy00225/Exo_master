const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'aa2a6b001@smtp-brevo.com',
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  const t = await getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'Exo Master <no-reply@exo-master.com>',
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Erreur envoi email:', err.message);
    return false;
  }
};

const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'https://exo-master.com'}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe - EXO MASTER',
    html: `<h1>Réinitialisation de votre mot de passe</h1>
           <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>Ce lien expirera dans 1 heure.</p>`
  });
};

module.exports = { sendMail, sendPasswordResetEmail };