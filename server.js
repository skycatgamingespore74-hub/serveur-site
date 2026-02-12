const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

console.log('==============================');
console.log('🚀 DÉMARRAGE DU SERVEUR');
console.log('==============================');

const app = express();
const PORT = process.env.PORT || 3000;

// URL publique (CORRIGÉ)
const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`;

console.log('🌍 URL serveur détectée :', PUBLIC_URL);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
const authRoutes = require('./routes');
const adminRoutes = require('./admin');

// DEBUG IMPORTANT
console.log('Type authRoutes:', typeof authRoutes);
console.log('Type adminRoutes:', typeof adminRoutes);

if (typeof authRoutes === 'function') {
    app.use('/', authRoutes);
} else {
    console.error('❌ authRoutes n\'est PAS une fonction');
}

if (typeof adminRoutes === 'function') {
    app.use('/admin', adminRoutes);
} else {
    console.error('❌ adminRoutes n\'est PAS une fonction');
}

// Racine
app.get('/', (req, res) => {
    console.log('🏠 Accès racine /');
    res.json({
        message: 'Serveur actif',
        url: PUBLIC_URL,
        time: new Date().toISOString()
    });
});

// Lancement
app.listen(PORT, () => {
    console.log('==============================');
    console.log(`✅ SERVEUR LANCÉ SUR LE PORT ${PORT}`);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
