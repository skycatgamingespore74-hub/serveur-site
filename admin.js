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
const SESSION_DURATION = 60 * 60 * 1000; // 1 heure

// =================== USERS & LOGS ===================
const users = [];
const logs = [];

// =================== LOGS ===================
function addLog(message) {
  if (logs.length >= 10) logs.shift();
  logs.push({
    message,
    createdAt: new Date()
  });
}

// =================== USERS ===================
function addUser(user) {
  users.push({
    ip: user.ip,
    email: user.email || null,   // <-- priorité email
    name: user.name || null,
    points: user.points || 0,
    credits: user.credits || 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  addLog(`Nouvel utilisateur : ${user.email || user.name || user.ip}`);
}

// =================== MIDDLEWARE ===================
function verifyAdmin(req, res, next) {
  const { sessionid } = req.headers;

  if (!sessionid || !sessions[sessionid])
    return res.status(403).json({ error: "Session invalide" });

  if (Date.now() - sessions[sessionid].createdAt > SESSION_DURATION) {
    delete sessions[sessionid];
    return res.status(403).json({ error: "Session expirée" });
  }

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

// 🔎 Status admin
router.post("/statusadmin", verifyBot, (req, res) => {
  res.json({
    success: true,
    connected: true,
    logs,
    isSuperAdmin: req.adminSession.isSuperAdmin
  });
});

// 🔗 Générer lien admin
router.post("/generate-link", verifyBot, (req, res) => {
  const token = crypto.randomBytes(24).toString("hex");

  tokens[token] = {
    discordId: req.body.discordId,
    expiresAt: Date.now() + 15 * 60 * 1000,
    used: false
  };

  const loginUrl = `${process.env.SITE_URL}/login.html?token=${token}`;

  res.json({ success: true, link: loginUrl });
});

// 🧪 Validation token
router.post("/validate-token", (req, res) => {
  const { token } = req.body;
  const tokenData = tokens[token];

  if (!tokenData) return res.json({ success: false, error: "Token invalide" });
  if (Date.now() > tokenData.expiresAt) {
    delete tokens[token];
    return res.json({ success: false, error: "Token expiré" });
  }
  if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });

  res.json({ success: true });
});

// 🔑 Login humain
router.post("/login-submit", (req, res) => {
  const { username, password, token } = req.body;
  const tokenData = tokens[token];

  if (!tokenData) return res.json({ success: false, error: "Token invalide" });
  if (Date.now() > tokenData.expiresAt) {
    delete tokens[token];
    return res.json({ success: false, error: "Token expiré" });
  }
  if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });

  const validUser =
    Object.values(admins).includes(username) ||
    Object.values(superAdmins).includes(username);
  const validPassword = password === process.env.ADMIN_PASSWORD;

  if (!validUser || !validPassword)
    return res.json({ success: false, error: "Identifiants incorrects" });

  tokenData.used = true;
  const sessionId = crypto.randomBytes(16).toString("hex");

  sessions[sessionId] = {
    username,
    isSuperAdmin: Object.values(superAdmins).includes(username),
    createdAt: Date.now()
  };

  addLog(`Connexion admin : ${username}`);
  res.json({ success: true, sessionId });
});

// 🔐 Session check
router.get("/session-check", verifyAdmin, (req, res) => {
  res.json({
    success: true,
    username: req.adminSession.username,
    isSuperAdmin: req.adminSession.isSuperAdmin
  });
});

// 🚪 Déconnexion
router.post("/disconnect", verifyAdmin, (req, res) => {
  addLog(`Déconnexion admin : ${req.adminSession.username}`);
  delete sessions[req.headers.sessionid];
  res.json({ success: true });
});

// =================== USERS ===================

// 🔥 accessible uniquement admin
router.get("/users", verifyAdmin, (req, res) => {
  const usersForDashboard = users.map(u => ({
    email: u.email || u.name || u.ip, // priorité email
    points: u.points || 0,
    credits: u.credits || 0
  }));

  res.json({ success: true, users: usersForDashboard });
});

// 🔥 accessible uniquement admin
router.get("/logs", verifyAdmin, (req, res) => {
  res.json({ success: true, logs });
});

// =================== SUPER ADMIN ===================
router.post("/secret-info", verifyAdmin, (req, res) => {
  if (!req.adminSession.isSuperAdmin)
    return res.status(403).json({ error: "Accès super-admin requis" });

  res.json({
    success: true,
    secretData: "Voici des informations super secrètes"
  });
});

// 🔥 EXPORT
module.exports = {
  router,  // <-- pour app.use('/admin', adminRoutes.router)
  addUser,
  addLog
};
