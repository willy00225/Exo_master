const { Pool } = require("pg");

// Si DATABASE_URL est fournie (Railway), on l'utilise AVEC SSL
// Sinon, on utilise la configuration locale (développement)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },   // ← OBLIGATOIRE pour Railway
      }
    : {
        user: "postgres",
        host: "localhost",
        database: "exo_master",
        password: "ReussiteForce@",
        port: 5432,
      }
);

// ✅ Gestion des erreurs inattendues (ex: ECONNRESET) pour éviter le crash du serveur
pool.on("error", (err) => {
  console.error("⚠️ Erreur inattendue du pool PostgreSQL :", err.message);
  // Le pool va automatiquement créer un nouveau client lors de la prochaine requête
});

// Connexion initiale (vérification au démarrage, non bloquante)
pool.connect((err, client, release) => {
  if (err) {
    console.error("Erreur connexion initiale PostgreSQL :", err.message);
  } else {
    console.log("PostgreSQL connecté");
    release();
  }
});

module.exports = pool;