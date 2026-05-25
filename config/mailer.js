const SibApiV3Sdk = require('sib-api-v3-sdk');

const apiKey = process.env.BREVO_API_KEY;
if (apiKey) {
  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications['api-key'].apiKey = apiKey;
  console.log('✅ API Brevo configurée');
} else {
  console.warn('⚠️ BREVO_API_KEY manquant');
}

// Template d'email réutilisable
const wrapEmail = (title, content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#0B0E1A; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B0E1A; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e1e2f 0%, #2d2d44 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.4);">
          <tr>
            <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <img src="https://exo-master.com/exo_master_logo.png" alt="EXO MASTER" style="height: 50px; margin-bottom: 10px;" />
              <h1 style="color:#ffffff; font-size: 24px; margin:0;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 40px; color:#cfcfcf; font-size: 16px; line-height: 1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: rgba(0,0,0,0.2); text-align: center; color:#888888; font-size: 12px;">
              © 2026 EXO MASTER. Tous droits réservés.<br/>
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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
  sendSmtpEmail.htmlContent = wrapEmail(subject, html);

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
  const content = `
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe (valable 1 heure) :</p>
    <div style="text-align:center; margin:30px 0;">
      <a href="${resetLink}" style="display:inline-block; background: linear-gradient(135deg, #8B5CF6, #06B6D4); color:#ffffff; text-decoration:none; padding: 14px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">Réinitialiser mon mot de passe</a>
    </div>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>
  `;
  return sendMail({ to: user.email, subject: 'Réinitialisation de votre mot de passe - EXO MASTER', html: content });
};

const sendVerificationEmail = async (user, token) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'https://exo-master.com'}/verify-email?token=${token}`;
  const content = `
    <p>Bienvenue sur EXO MASTER !</p>
    <p>Pour activer votre compte et accéder à tous les exercices, veuillez vérifier votre adresse email en cliquant ci-dessous :</p>
    <div style="text-align:center; margin:30px 0;">
      <a href="${verificationLink}" style="display:inline-block; background: linear-gradient(135deg, #8B5CF6, #06B6D4); color:#ffffff; text-decoration:none; padding: 14px 40px; border-radius: 30px; font-weight: bold; font-size: 16px;">Vérifier mon email</a>
    </div>
    <p>Ce lien expirera dans 24 heures.</p>
  `;
  return sendMail({ to: user.email, subject: 'Vérifiez votre adresse email - EXO MASTER', html: content });
};

module.exports = { sendMail, sendPasswordResetEmail, sendVerificationEmail };