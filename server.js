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

// Routes
const authRoutes = require('./routes'); // ton fichier auth/routes
const adminRoutes = require('./admin');

if (authRoutes) app.use('/', authRoutes);      // routes utilisateurs
if (adminRoutes) app.use('/admin', adminRoutes); // routes admin

// Racine
app.get('/', (req, res) => {
    console.log('🏠 Accès racine /');
    res.json({ message: 'Serveur actif', url: PUBLIC_URL, time: new Date().toISOString() });
});

// Lancement
app.listen(PORT, () => {
    console.log('==============================');
    console.log(`✅ SERVEUR LANCÉ SUR LE PORT ${PORT}`);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
