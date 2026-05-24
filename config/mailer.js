const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // utiliser SSL
    auth: {
      user: process.env.SMTP_USER || 'no-reply@exo-master.com',
      pass: process.env.SMTP_PASS || 'ReussiteForce@77',
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

module.exports = { sendMail };