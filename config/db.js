const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "exo_master",
  password: "ReussiteForce@",
  port: 5432,
});

pool.connect((err) => {
  if (err) {
    console.error("Erreur connexion PostgreSQL", err);
  } else {
    console.log("PostgreSQL connecté");
  }
});

module.exports = pool;