const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

console.log('==============================');
console.log('🚀 DÉMARRAGE DU SERVEUR');
console.log('==============================');

const app = express();
const PORT = process.env.PORT || 3000;

// URL publique
const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;
console.log('🌍 URL serveur détectée :', PUBLIC_URL);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Charger toutes les routes depuis routes.js
const routes = require('./routes'); // <-- ton fichier unique de routes
app.use('/', routes);

// Racine
app.get('/', (req, res) => {
    console.log('🏠 Accès racine /');
    res.json({ message: 'Serveur actif', url: PUBLIC_URL, time: new Date().toISOString() });
});

// Route pour vérifier le token côté page login
app.get("/login", (req, res) => {
    try {
        const { token } = req.query;

        // Ici, tokens est un objet en mémoire ou en base avec les tokens valides
        if (!token || !tokens[token]) {
            return res.redirect("/"); // token inexistant ou invalide
        }

        // Token valide -> renvoyer la page login admin
        res.sendFile(__dirname + "/login.html");

    } catch (err) {
        console.error("❌ Erreur route /login :", err);
        res.redirect("/"); // sécurité : redirige vers l'accueil
    }
}); // <-- fermeture du app.get
// server.js
const adminRoutes = require('./admin');
app.use('/admin', adminRoutes); // <-- obligatoire pour que Express connaisse les routes

// Lancement
app.listen(PORT, () => {
    console.log('==============================');
    console.log(`✅ SERVEUR LANCÉ SUR LE PORT ${PORT}`);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
