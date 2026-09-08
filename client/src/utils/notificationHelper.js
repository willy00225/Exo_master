// utils/notificationHelper.js
const pool = require("../config/db");
const webpush = require("../config/webpush");

/**
 * Crée une notification interne et envoie une notification push si l'utilisateur est abonné.
 * @param {Object} param0
 * @param {number} param0.userId - ID de l'utilisateur destinataire
 * @param {string} param0.message - Contenu du message
 * @param {string} param0.type - Type (success, error, info)
 * @param {string} param0.link - Lien de redirection (ex: /student/challenges)
 */
async function createNotification({ userId, message, type = "info", link = "/" }) {
  try {
    // 1. Insérer la notification en base (pour l'affichage dans la cloche)
    const insertResult = await pool.query(
      `INSERT INTO notifications (user_id, message, type, link, is_read)
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [userId, message, type, link]
    );

    console.log(`🔔 Notification interne créée (ID ${insertResult.rows[0].id})`);

    // 2. Récupérer tous les abonnements push de cet utilisateur
    const subscriptions = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
      [userId]
    );

    // 3. Envoyer une notification push à chaque abonnement
    for (const sub of subscriptions.rows) {
      const payload = JSON.stringify({
        title: "EXO MASTER",
        body: message,
        url: link,
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        console.log(`📲 Notification push envoyée à l'utilisateur ${userId}`);
      } catch (err) {
        console.error(`❌ Erreur envoi push pour utilisateur ${userId}:`, err.message);
        // Optionnel : supprimer l'abonnement s'il est invalide (ex: 404, 410)
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [sub.endpoint]);
        }
      }
    }
  } catch (err) {
    console.error("Erreur dans createNotification:", err);
    // Ne pas bloquer l'appelant en cas d'erreur de notification
  }
}

module.exports = { createNotification };