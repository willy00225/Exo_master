const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Récupérer le token du header Authorization
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Accès refusé. Token manquant." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // contient { id, email, iat, exp }
    next();
  } catch (err) {
    res.status(400).json({ error: "Token invalide." });
  }
};