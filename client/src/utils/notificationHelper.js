const pool = require("../config/db");

const createNotification = async ({ userId, message, type = 'info', link = null }) => {
  try {
    await pool.query(
      "INSERT INTO notifications (user_id, message, type, link) VALUES ($1, $2, $3, $4)",
      [userId, message, type, link]
    );
  } catch (err) {
    console.error("Erreur création notification:", err);
  }
};

module.exports = { createNotification };