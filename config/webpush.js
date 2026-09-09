const webpush = require('web-push');

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:admin@exomaster.com', vapidPublicKey, vapidPrivateKey);
  console.log('🔔 Web Push configuré');
} else {
  console.warn('⚠️ Clés VAPID manquantes. Notifications push désactivées.');
}

module.exports = webpush;