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

// Charger le module admin
require('./admin'); // <-- c’est tout ce qu’il faut

// Lancement
app.listen(PORT, () => {
    console.log('==============================');
    console.log(`✅ SERVEUR LANCÉ SUR LE PORT ${PORT}`);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
