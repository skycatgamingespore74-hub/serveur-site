// admin.js
const express = require("express");
const router = express.Router();

// =================== ADMINS ===================
// Discord ID : identité numérique
const admins = {};

const superAdmins = {
    "1340907519815450704": "7^Im7VfpmfHq" // exemple super-admin
};

// =================== MIDDLEWARE ===================
// Vérifie que la requête vient d’un admin ou super-admin ET du bot
function verifyAdmin(req, res, next) {
    try {
        const { discordId, identity, serverSecret } = req.body;

        // Vérifie la présence de toutes les infos
        if (!discordId || !serverSecret) {
            console.log("[SECURITY] Requête bloquée : infos manquantes");
            return res.status(400).json({ error: "Discord ID et serveur secret requis" });
        }

        // Vérifie le server secret
        if (serverSecret !== process.env.SERVER_SECRET) {
            console.log(`[SECURITY] Server secret invalide reçu de Discord ID: ${discordId}`);
            return res.status(403).json({ error: "Server secret invalide" });
        }

        // Vérifie si l'utilisateur est admin ou super-admin
        if (discordId === "BOT") { 
            // Cas spécial pour le bot : passe uniquement avec serverSecret
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

// Test de statut du serveur pour le bot
router.post("/statusadmin", verifyAdmin, (req, res) => {
    try {
        const { discordId } = req.body;
        console.log(`[ADMIN STATUS] Demande de statut reçue de Discord ID: ${discordId}`);

        const serverConnected = true; // exemple simple
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

// Exemple route réservée aux super-admins
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
