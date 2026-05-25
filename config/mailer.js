const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: 'aa2a6b001@smtp-brevo.com',
      pass: process.env.SMTP_PASS || 'xsmtpsib-22681bb20658df3c13aa5a23afb7e8fd40ac0284766c0c7150d4b1624fbae026-6BUDs0zNZvrMYHeS',
    },
  });

  console.log('✅ Transporteur SMTP Brevo initialisé');
  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  const t = await getTransporter();
  if (!t) return false;
  try {
    await t.sendMail({
      from: 'Exo Master <willyblack369@gmail.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email envoyé à ${to}`);
    return true;
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message);
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