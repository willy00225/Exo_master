const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const pool = require("./config/db");

// ========== INITIALISATION DES TABLES ==========
(async () => {
  try {
    // Vérification connexion DB
    await pool.query("SELECT 1");
    console.log("Base de données connectée");

    // Création des tables dans l'ordre des dépendances
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        subscription_expires DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        subject VARCHAR(255),
        level VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT unique_group UNIQUE (name, subject, level)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_groups (
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        group_id INT REFERENCES groups(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, group_id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id SERIAL PRIMARY KEY,
        group_id INT REFERENCES groups(id) ON DELETE CASCADE,
        title VARCHAR(255),
        description TEXT,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        content TEXT,
        correction TEXT,
        file_path VARCHAR(255),
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy','medium','hard','very_hard')),
        group_id INT REFERENCES groups(id) ON DELETE CASCADE,
        chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2),
        transaction_ref VARCHAR(255),
        proof_image VARCHAR(255),
        status VARCHAR(20) CHECK (status IN ('pending','validated','rejected')) DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'manual',
        gate_reference VARCHAR(255),
        subscription_days INT DEFAULT 30,
        validated_by INT REFERENCES users(id),
        validated_at TIMESTAMP,
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id SERIAL PRIMARY KEY,
        group_id INT REFERENCES groups(id) ON DELETE CASCADE,
        chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy','medium','hard','very_hard')),
        question_text TEXT,
        options JSONB,
        correct_option INT,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        group_id INT REFERENCES groups(id) ON DELETE CASCADE,
        chapter_id INT REFERENCES chapters(id) ON DELETE SET NULL,
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy','medium','hard','very_hard')),
        question_count INT DEFAULT 10,
        difficulty_filter VARCHAR(20),
        time_limit INT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
        challenge_id INT,
        score INT,
        total_questions INT,
        time_spent INT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        challenger_id INT REFERENCES users(id),
        challenged_id INT REFERENCES users(id),
        quiz_id INT REFERENCES quizzes(id),
        status VARCHAR(20) CHECK (status IN ('pending','accepted','declined','completed')),
        winner_id INT REFERENCES users(id),
        challenger_score INT,
        challenged_score INT,
        challenger_time INT,
        challenged_time INT,
        created_at TIMESTAMP DEFAULT NOW(),
        accepted_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insertions par défaut (ignorées si existent)
    await pool.query(`
      INSERT INTO groups (name, subject, level) VALUES
      ('6ème', 'Toutes matières', '6e'),
      ('5ème', 'Toutes matières', '5e'),
      ('4ème', 'Toutes matières', '4e'),
      ('3ème', 'Toutes matières', '3e'),
      ('Seconde C', 'Toutes matières', '2nde'),
      ('Seconde A', 'Toutes matières', '2nde'),
      ('Première C', 'Toutes matières', '1ère'),
      ('Première D', 'Toutes matières', '1ère'),
      ('Première A', 'Toutes matières', '1ère'),
      ('Terminale C', 'Toutes matières', 'Term'),
      ('Terminale D', 'Toutes matières', 'Term'),
      ('Terminale A', 'Toutes matières', 'Term')
      ON CONFLICT (name, subject, level) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin', 'admin@exomaster.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9O5mZ0V9P1VDg6j5zqBxRJxZq.', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO settings (key, value, description) VALUES
      ('trial_days', '7', 'Durée de l''essai gratuit en jours')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log("Tables et données initialisées avec succès");
  } catch (err) {
    console.error("Erreur lors de l'initialisation de la base de données", err.message);
  }
})();

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir les fichiers uploadés statiquement
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.get("/", (req, res) => {
  res.send("API OK 🚀");
});

// 🔥 Test connexion PostgreSQL
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Connexion PostgreSQL OK",
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Erreur connexion DB",
    });
  }
});

// Route publique pour récupérer la liste des groupes (inscription)
app.get("/api/public/groups", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, subject, level FROM groups ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Import et utilisation des routes d'authentification
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Import et utilisation des routes de groupes
const groupRoutes = require("./routes/groups");
app.use("/api/groups", groupRoutes);

// Import et utilisation des routes d'exercices
const exerciseRoutes = require("./routes/exercises");
app.use("/api/exercises", exerciseRoutes);

// Import et utilisation des routes d'association utilisateur-groupes
const userGroupRoutes = require("./routes/userGroups");
app.use("/api/user-groups", userGroupRoutes);

// Import et utilisation des routes de chapitres
const chapterRoutes = require("./routes/chapters");
app.use("/api/chapters", chapterRoutes);

// Import et utilisation des routes de paiements
const paymentRoutes = require("./routes/payments");
app.use("/api/payments", paymentRoutes);

// Import et utilisation des routes de quizz
const quizRoutes = require("./routes/quizzes");
app.use("/api/quizzes", quizRoutes);

// Import et utilisation des routes de openAI
const aiRoutes = require("./routes/ai");
app.use("/api/ai", aiRoutes);

// Import et utilisation des routes de questions (banque de questions)
const questionRoutes = require("./routes/questions");
app.use("/api/questions", questionRoutes);

// Import et utilisation des routes de challenges
const challengeRoutes = require("./routes/challenges");
app.use("/api/challenges", challengeRoutes);

// Import et utilisation des routes de settings
const settingsRoutes = require("./routes/settings");
app.use("/api/settings", settingsRoutes);

// Import et utilisation des routes de students
const adminStudentRoutes = require("./routes/admin/students");
app.use("/api/admin/students", adminStudentRoutes);

// Import et utilisation des routes de admin stats
const adminStatsRoutes = require("./routes/admin/stats");
app.use("/api/admin/stats", adminStatsRoutes);

// Import et utilisation des routes de student stats
const studentStatsRoutes = require("./routes/student/stats");
app.use("/api/student/stats", studentStatsRoutes);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});