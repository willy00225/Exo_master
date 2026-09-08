const webpush = require('web-push');

const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  throw new Error('Les clés VAPID doivent être définies dans les variables d\'environnement.');
}

webpush.setVapidDetails(
  'mailto:admin@exomaster.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = webpush;