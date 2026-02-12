// admin.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { Pool } = require("pg");

// =================== DB CONFIG ===================
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
router.post("/statusadmin", verifyBot, async (req, res) => {
  try {
    const logsRes = await db.query(`SELECT message FROM "Table logs" ORDER BY created_at DESC LIMIT 10`);
    const recentLogs = logsRes.rows.map(l => l.message);

    res.json({
      success: true,
      connected: true,
      logs: recentLogs,
      isSuperAdmin: req.adminSession.isSuperAdmin
    });
  } catch (err) {
    console.error("Erreur /statusadmin :", err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

router.post("/generate-link", verifyBot, (req, res) => {
  try {
    const token = crypto.randomBytes(24).toString("hex");
    tokens[token] = { discordId: req.body.discordId, expiresAt: Date.now() + 15*60*1000, used: false };
    const loginUrl = `${process.env.SITE_URL}/login.html?token=${token}`;
    res.json({ success: true, link: loginUrl });
  } catch (err) {
    console.error("[GENERATE LINK] Erreur :", err);
    res.status(500).json({ error: "Erreur génération lien" });
  }
});

router.post("/validate-token", (req, res) => {
  const { token } = req.body;
  const tokenData = tokens[token];
  if (!tokenData) return res.json({ success: false, error: "Token invalide" });
  if (Date.now() > tokenData.expiresAt) { delete tokens[token]; return res.json({ success: false, error: "Token expiré" }); }
  if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });
  res.json({ success: true });
});

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

router.get("/session-check", verifyAdmin, (req, res) => {
  res.json({ success: true, username: req.adminSession.username, isSuperAdmin: req.adminSession.isSuperAdmin });
});

router.post("/disconnect", verifyAdmin, (req, res) => {
  delete sessions[req.headers.sessionid];
  res.json({ success: true });
});

router.get("/users", verifyAdmin, async (req, res) => {
  try {
    const usersRes = await db.query(`SELECT ip, name, points, is_super, created_at, updated_at FROM "Table users" ORDER BY created_at DESC`);
    res.json({ success: true, users: usersRes.rows });
  } catch (err) {
    console.error("Erreur /users :", err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

router.get("/logs", verifyAdmin, async (req, res) => {
  try {
    const logsRes = await db.query(`SELECT message, created_at FROM "Table logs" ORDER BY created_at DESC LIMIT 50`);
    res.json({ success: true, logs: logsRes.rows });
  } catch (err) {
    console.error("Erreur /logs :", err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

router.post("/secret-info", verifyAdmin, (req, res) => {
  if (!req.adminSession.isSuperAdmin) return res.status(403).json({ error: "Accès super-admin requis" });
  res.json({ success: true, secretData: "Voici des informations super secrètes" });
});

module.exports = router;
