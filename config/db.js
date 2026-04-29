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

pool.connect((err) => {
  if (err) {
    console.error("Erreur connexion PostgreSQL", err);
  } else {
    console.log("PostgreSQL connecté");
  }
});

module.exports = pool;