// admin.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const path = require("path");

// =================== ADMINS ===================
const admins = {
    // "DISCORD_ID": "IDENTITY"
};
const superAdmins = {
    "1340907519815450704": "7^Im7VfpmfHq",
    "BOT": "BOT"
};

// =================== TOKENS ===================
const tokens = {};

// =================== SESSIONS ===================
const sessions = {}; // { sessionId: { username, isSuperAdmin, createdAt } }

// =================== UTILISATEURS ===================
const users = [
    { ip: "192.168.1.10", name: "Alice", points: 100 },
    { ip: "192.168.1.20", name: null, points: 50 },
    { ip: "10.0.0.5", name: "Bob", points: 80 },
];

// =================== LOGS ===================
const logs = ["Serveur démarré", "Connexion de Alice", "Connexion de Bob"];

// =================== MIDDLEWARE ===================
function verifyAdmin(req, res, next) {
    try {
        const { sessionid } = req.headers;
        if (!sessionid || !sessions[sessionid]) {
            return res.status(403).json({ error: "Session invalide" });
        }
        req.adminSession = sessions[sessionid];
        next();
    } catch (err) {
        console.error("[MIDDLEWARE] Erreur :", err);
        res.status(500).json({ error: "Erreur serveur" });
    }
}

// =================== ROUTES ===================

// 🔎 Test statut admin
router.post("/statusadmin", verifyAdmin, (req, res) => {
    res.json({
        success: true,
        connected: true,
        logs: logs.slice(-10),
        isSuperAdmin: req.adminSession.isSuperAdmin
    });
});

// 🔗 Générer un lien admin temporaire
router.post("/generate-link", verifyAdmin, (req, res) => {
    try {
        const token = crypto.randomBytes(24).toString("hex");
        tokens[token] = {
            discordId: req.body.discordId,
            expiresAt: Date.now() + 15 * 60 * 1000,
            used: false
        };
        const loginUrl = `${process.env.SITE_URL}/login.html?token=${token}`;
        console.log(`[ADMIN LINK] Généré pour ${req.body.discordId}`);
        res.json({ success: true, link: loginUrl });
    } catch (err) {
        console.error("[GENERATE LINK] Erreur :", err);
        res.status(500).json({ error: "Erreur génération lien" });
    }
});

// 🧪 Validation du token côté site (login.html)
router.post("/validate-token", (req, res) => {
    try {
        const { token } = req.body;
        const tokenData = tokens[token];
        if (!tokenData) return res.json({ success: false, error: "Token invalide" });
        if (Date.now() > tokenData.expiresAt) {
            delete tokens[token];
            return res.json({ success: false, error: "Token expiré" });
        }
        if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });
        res.json({ success: true });
    } catch (err) {
        console.error("[VALIDATE TOKEN] Erreur :", err);
        res.json({ success: false, error: "Erreur serveur" });
    }
});

// 🌐 Page login admin
router.get("/login", (req, res) => {
    const { token } = req.query;
    if (!token) return res.redirect("/");
    res.redirect(`${process.env.SITE_URL}/login.html?token=${token}`);
});

// 🔑 Soumission formulaire login.html
router.post("/login-submit", (req, res) => {
    try {
        const { username, password, token } = req.body;
        const tokenData = tokens[token];
        if (!tokenData) return res.json({ success: false, error: "Token invalide" });
        if (Date.now() > tokenData.expiresAt) {
            delete tokens[token];
            return res.json({ success: false, error: "Token expiré" });
        }
        if (tokenData.used) return res.json({ success: false, error: "Token déjà utilisé" });

        const validUser = Object.values(admins).includes(username) || Object.values(superAdmins).includes(username);
        const validPassword = password === process.env.ADMIN_PASSWORD;
        if (!validUser || !validPassword) return res.json({ success: false, error: "Identifiants incorrects" });

        tokenData.used = true;

        // Créer session
        const sessionId = crypto.randomBytes(16).toString("hex");
        sessions[sessionId] = {
            username,
            isSuperAdmin: Object.values(superAdmins).includes(username),
            createdAt: Date.now()
        };

        res.json({ success: true, sessionId });
    } catch (err) {
        console.error("[LOGIN SUBMIT] Erreur :", err);
        res.json({ success: false, error: "Erreur serveur" });
    }
});

// 🔐 Dashboard routes

// Vérifier session dashboard
router.get("/session-check", verifyAdmin, (req, res) => {
    res.json({
        success: true,
        username: req.adminSession.username,
        isSuperAdmin: req.adminSession.isSuperAdmin
    });
});

// Déconnexion
router.post("/disconnect", verifyAdmin, (req, res) => {
    delete sessions[req.headers.sessionid];
    res.json({ success: true });
});

// Récupérer utilisateurs
router.get("/users", verifyAdmin, (req, res) => {
    res.json({ success: true, users });
});

// Récupérer logs
router.get("/logs", verifyAdmin, (req, res) => {
    res.json({ success: true, logs });
});

// 🔐 Route super-admin uniquement
router.post("/secret-info", verifyAdmin, (req, res) => {
    if (!req.adminSession.isSuperAdmin) return res.status(403).json({ error: "Accès super-admin requis" });
    res.json({ success: true, secretData: "Voici des informations super secrètes" });
});

module.exports = router;
