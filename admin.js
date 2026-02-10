// admin.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

// =================== ADMINS ===================
const admins = {};

const superAdmins = {
    "1340907519815450704": "7^Im7VfpmfHq"
};

// =================== MIDDLEWARE ===================
function verifyAdmin(req, res, next) {
    try {
        const { discordId, identity, serverSecret } = req.body;

        if (!discordId || !serverSecret) {
            console.log("[SECURITY] Requête bloquée : infos manquantes");
            return res.status(400).json({ error: "Discord ID et serveur secret requis" });
        }

        if (serverSecret !== process.env.SERVER_SECRET) {
            console.log(`[SECURITY] Server secret invalide reçu de Discord ID: ${discordId}`);
            return res.status(403).json({ error: "Server secret invalide" });
        }

        // Cas spécial pour le bot
        if (discordId === "BOT") {
            req.isSuperAdmin = false;
            return next();
        }

        if (admins[discordId] === identity || superAdmins[discordId] === identity) {
            req.isSuperAdmin = !!superAdmins[discordId];
            return next();
        }

        console.log(`[SECURITY] Accès refusé : utilisateur non autorisé Discord ID: ${discordId}`);
        return res.status(403).json({ error: "Utilisateur non autorisé" });

    } catch (err) {
        console.error("[MIDDLEWARE] Erreur de vérification :", err);
        return res.status(500).json({ error: "Erreur serveur lors de la vérification" });
    }
}

// =================== ROUTES ===================

// Test statut serveur
router.post("/statusadmin", verifyAdmin, (req, res) => {
    try {
        const { discordId } = req.body;
        console.log(`[ADMIN STATUS] Demande de statut reçue de Discord ID: ${discordId}`);

        const serverConnected = true;
        const logs = ["Serveur actif", "Aucun problème détecté"];

        res.json({
            success: true,
            connected: serverConnected,
            logs: logs,
            isSuperAdmin: req.isSuperAdmin
        });
    } catch (err) {
        console.error("[ADMIN STATUS] Erreur :", err);
        res.status(500).json({ error: "Impossible de vérifier le statut du serveur" });
    }
});

// token

// Stockage temporaire des tokens (en mémoire)
const tokens = {}; // { token: { discordId, expiresAt, used } }

// Route pour générer un lien temporaire
router.post("/generate-link", verifyAdmin, (req, res) => {
    try {
        const token = crypto.randomBytes(16).toString("hex"); // 32 caractères aléatoires
        const loginUrl = `${process.env.PUBLIC_URL}/login?token=${token}`;

        // Stocke le token avec expiration dans 1 heure et flag utilisé=false
        tokens[token] = {
            discordId: req.body.discordId,
            expiresAt: Date.now() + 60 * 60 * 1000, // 1 heure
            used: false
        };

        console.log(`[GENERATE LINK] Lien généré pour Discord ID: ${req.body.discordId} -> ${loginUrl}`);
        res.json({
            success: true,
            link: loginUrl
        });
    } catch (err) {
        console.error("[GENERATE LINK] Erreur :", err);
        res.status(500).json({ error: "Impossible de générer le lien" });
    }
});

// Route pour vérifier le token côté page login
router.get("/login", (req, res) => {
    try {
        const { token } = req.query;
        if (!token || !tokens[token]) {
            return res.redirect("/"); // token inexistant
        }

        const tokenData = tokens[token];

        // Vérifie expiration et usage
        if (tokenData.used || Date.now() > tokenData.expiresAt) {
            delete tokens[token]; // supprime token expiré ou utilisé
            return res.redirect("/"); // redirige vers l'accueil
        }

        // Marque comme utilisé
        tokenData.used = true;

        // Ici, tu peux afficher la page login
        res.sendFile(path.join(__dirname, "login.html")); // mettre ton login.html au bon chemin

    } catch (err) {
        console.error("[LOGIN] Erreur :", err);
        res.redirect("/");
    }
});
// Route réservée super-admins
router.post("/secret-info", verifyAdmin, (req, res) => {
    try {
        if (!req.isSuperAdmin) {
            console.log(`[SECURITY] Tentative d'accès non autorisé Discord ID: ${req.body.discordId}`);
            return res.status(403).json({ error: "Seulement les super-admins peuvent accéder à cette info" });
        }

        console.log(`[SECRET INFO] Requête par SuperAdmin ID: ${req.body.discordId}`);

        res.json({
            success: true,
            secretData: "Voici des informations super secrètes !"
        });
    } catch (err) {
        console.error("[SECRET INFO] Erreur :", err);
        res.status(500).json({ error: "Impossible de récupérer les informations" });
    }
});

module.exports = router;
