const SibApiV3Sdk = require('sib-api-v3-sdk');

const apiKey = process.env.BREVO_API_KEY;
let defaultClient = null;

if (apiKey) {
  defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications['api-key'].apiKey = apiKey;
  console.log('✅ API Brevo configurée');
} else {
  console.warn('⚠️ BREVO_API_KEY manquant – les emails ne seront pas envoyés');
}

const sendMail = async ({ to, subject, html }) => {
  if (!apiKey) {
    console.error('❌ Clé API Brevo absente');
    return false;
  }

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = {
    email: process.env.SMTP_FROM_EMAIL || 'willyblack369@gmail.com',
    name: 'Exo Master'
  };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;

  console.log(`📧 Envoi email à ${to} via API Brevo`);
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email envoyé – ID message : ${data.messageId}`);
    return true;
  } catch (err) {
    console.error('❌ Erreur API Brevo :', err.response?.body || err.message);
    return false;
  }
};

const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${process.env.FRONTEND_URL || 'https://exo-master.com'}/reset-password?token=${token}`;
  return sendMail({
    to: user.email,
    subject: 'Réinitialisation de votre mot de passe - EXO MASTER',
    html: `<h1>Réinitialisation de votre mot de passe</h1>
           <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>Ce lien expirera dans 1 heure.</p>`
  });
};

module.exports = { sendMail, sendPasswordResetEmail };