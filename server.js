const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const pool = require("./config/db");

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