const { Pool } = require("pg");

// Utilise DATABASE_URL si elle existe (production), sinon la configuration locale
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
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