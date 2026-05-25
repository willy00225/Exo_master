const SibApiV3Sdk = require('sib-api-v3-sdk');

const apiKey = process.env.BREVO_API_KEY;

if (apiKey) {
  SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = apiKey;
}

const sendMail = async ({ to, subject, html }) => {
  if (!apiKey) {
    console.error('Clé API Brevo manquante.');
    return false;
  }
  
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = { 
    email: process.env.SMTP_FROM_EMAIL || 'no-reply@exo-master.com', 
    name: 'Exo Master' 
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (err) {
    console.error('Erreur envoi email Brevo:', err.response?.body || err.message);
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