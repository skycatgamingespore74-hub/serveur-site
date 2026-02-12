// admin.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// =================== ADMINS ===================
const admins = {}; 
const superAdmins = {
  "1340907519815450704": "7^Im7VfpmfHq",
  "BOT": "BOT"
};

// =================== TOKENS ===================
const tokens = {};

// =================== SESSIONS ===================
const sessions = {}; 

// =================== USERS & LOGS ===================
const users = []; // comptes créés
const logs = []; // logs, max 10

function addLog(message) {
  if (logs.length >= 10) logs.shift(); // supprime le plus ancien
  logs.push({ message, createdAt: new Date() });
}

// =================== MIDDLEWARE ===================
function verifyAdmin(req, res, next) {
  const { sessionid } = req.headers;
  if (!sessionid || !sessions[sessionid])
    return res.status(403).json({ error: "Session invalide" });
  req.adminSession = sessions[sessionid];
  next();
}

function verifyBot(req, res, next) {
  const { discordId, identity, serverSecret } = req.body;
  if (!discordId || !identity || !serverSecret)
    return res.status(400).json({ error: "Paramètres manquants" });

  if (serverSecret !== process.env.SERVER_SECRET)
    return res.status(403).json({ error: "Accès refusé" });

  const isSuperAdmin = superAdmins[discordId] === identity;
  const isAdmin = admins[discordId] === identity || isSuperAdmin;
  if (!isAdmin)
    return res.status(403).json({ error: "Utilisateur non autorisé" });

  req.adminSession = { username: identity, isSuperAdmin };
  next();
}

// =================== ROUTES ===================

// 🔎 Test statut admin (bot Discord)
router.post("/statusadmin", verifyBot, (req, res) => {
  res.json({
    success: true,
    connected: true,
    logs,
    isSuperAdmin: req.adminSession.isSuperAdmin
  });
});

// 🔗 Générer un lien admin temporaire (bot Discord)
router.post("/generate-link", verifyBot, (req, res) => {
  const token = crypto.randomBytes(24).toString("hex");
  tokens[token] = {
    discordId: req.body.discordId,
    expiresAt: Date.now() + 15*60*1000,
    used: false
  };
  const loginUrl = `${process.env.SITE_URL}/login.html?token=${token}`;
  res.json({ success: true, link: loginUrl });
});

// 🧪 Validation du token côté site (login.html)
router.post("/validate-token", (req, res) => {
  const { token } = req.body;
  const tokenData = tokens[token];
  if (!tokenData) return res.json({ success: false, error: "Token invalide" });
  if (Date.now() > tokenData.expiresAt) { delete tokens[token]; return res.json({ success: false, error: "Token expiré" }); }
  if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });
  res.json({ success: true });
});

// 🔑 Login-submit (dashboard humain)
router.post("/login-submit", (req, res) => {
  const { username, password, token } = req.body;
  const tokenData = tokens[token];
  if (!tokenData) return res.json({ success: false, error: "Token invalide" });
  if (Date.now() > tokenData.expiresAt) { delete tokens[token]; return res.json({ success: false, error: "Token expiré" }); }
  if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });

  const validUser = Object.values(admins).includes(username) || Object.values(superAdmins).includes(username);
  const validPassword = password === process.env.ADMIN_PASSWORD;
  if (!validUser || !validPassword) return res.json({ success: false, error: "Identifiants incorrects" });

  tokenData.used = true;
  const sessionId = crypto.randomBytes(16).toString("hex");
  sessions[sessionId] = { username, isSuperAdmin: Object.values(superAdmins).includes(username), createdAt: Date.now() };
  res.json({ success: true, sessionId });
});

// 🔐 Dashboard humain routes
router.get("/session-check", verifyAdmin, (req, res) => {
  res.json({ success: true, username: req.adminSession.username, isSuperAdmin: req.adminSession.isSuperAdmin });
});

router.post("/disconnect", verifyAdmin, (req, res) => {
  delete sessions[req.headers.sessionid];
  res.json({ success: true });
});

// 🧑‍💻 Users
router.post("/create-user", (req, res) => {
  const { ip, name, points } = req.body;
  users.push({ ip, name, points: points || 0, createdAt: new Date(), updatedAt: new Date() });
  addLog(`Utilisateur créé: ${name || ip}`);
  res.json({ success: true });
});

router.get("/users", (req, res) => {
  res.json({ success: true, users });
});

// 📝 Logs
router.get("/logs", (req, res) => {
  res.json({ success: true, logs });
});

// 🔐 Super-admin uniquement
router.post("/secret-info", verifyAdmin, (req, res) => {
  if (!req.adminSession.isSuperAdmin) return res.status(403).json({ error: "Accès super-admin requis" });
  res.json({ success: true, secretData: "Voici des informations super secrètes" });
});

module.exports = router;
