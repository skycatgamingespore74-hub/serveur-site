// admin.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const path = require("path");

// =================== ADMINS ===================
// identity STRICTEMENT liée au Discord ID
const admins = {
    // "DISCORD_ID": "IDENTITY"
    // Exemple: "123456789012345678": "abc123"
};

const superAdmins = {
    "1340907519815450704": "7^Im7VfpmfHq",
    "BOT": "BOT"
};

// =================== TOKENS ===================
// { token: { discordId, expiresAt, used } }
const tokens = {};

// =================== MIDDLEWARE ===================
function verifyAdmin(req, res, next) {
    try {
        const { discordId, identity, serverSecret } = req.body;

        if (!discordId || !identity || !serverSecret) {
            return res.status(400).json({ error: "Paramètres manquants" });
        }

        if (serverSecret !== process.env.SERVER_SECRET) {
            console.log(`[SECURITY] Server secret invalide (${discordId})`);
            return res.status(403).json({ error: "Accès refusé" });
        }

        if (admins[discordId] === identity) {
            req.isSuperAdmin = false;
            return next();
        }

        if (superAdmins[discordId] === identity) {
            req.isSuperAdmin = true;
            return next();
        }

        console.log(`[SECURITY] Identity invalide pour Discord ID ${discordId}`);
        return res.status(403).json({ error: "Utilisateur non autorisé" });

    } catch (err) {
        console.error("[MIDDLEWARE] Erreur :", err);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

// =================== ROUTES ===================

// 🔎 Test statut admin
router.post("/statusadmin", verifyAdmin, (req, res) => {
    res.json({
        success: true,
        connected: true,
        logs: ["Serveur actif", "Aucun problème détecté"],
        isSuperAdmin: req.isSuperAdmin
    });
});

// 🔗 Générer un lien admin temporaire
router.post("/generate-link", verifyAdmin, (req, res) => {
    try {
        const token = crypto.randomBytes(24).toString("hex");

        tokens[token] = {
            discordId: req.body.discordId,
            expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
            used: false
        };

        const loginUrl = `${process.env.SITE_URL}/admin/login?token=${token}`;

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

        if (tokenData.used) {
            return res.json({ success: false, error: "Token déjà utilisé" });
        }

        // Token valide → ne le consomme pas encore
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

    // Redirige vers le site avec le token en query
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

        // Vérification des identifiants
        const validUser = Object.values(admins).includes(username) || Object.values(superAdmins).includes(username);
        const validPassword = password === process.env.ADMIN_PASSWORD;

        if (!validUser || !validPassword) {
            return res.json({ success: false, error: "Identifiants incorrects" });
        }

        // Consommer le token seulement après login réussi
        tokenData.used = true;

        res.json({ success: true });
    } catch (err) {
        console.error("[LOGIN SUBMIT] Erreur :", err);
        res.json({ success: false, error: "Erreur serveur" });
    }
});

// 🔐 Route super-admin uniquement
router.post("/secret-info", verifyAdmin, (req, res) => {
    if (!req.isSuperAdmin) return res.status(403).json({ error: "Accès super-admin requis" });

    res.json({
        success: true,
        secretData: "Voici des informations super secrètes"
    });
});

module.exports = router;
