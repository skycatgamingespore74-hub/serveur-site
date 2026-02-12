
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

// =================== MIDDLEWARE ===================
app.use(cors());
app.use(bodyParser.json());

// =================== ROUTES ===================

app.set('trust proxy', true);

// Routes principales
const authRoutes = require('./routes');

// 🔥 On récupère le router depuis admin.js
const { router: adminRoutes } = require('./admin');

// Debug
console.log('Type authRoutes:', typeof authRoutes);
console.log('Type adminRoutes:', typeof adminRoutes);

// Sécurisation
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

// =================== ROUTE RACINE ===================
app.get('/', (req, res) => {
    console.log('🏠 Accès racine /');
    res.json({
        message: 'Serveur actif',
        url: PUBLIC_URL,
        time: new Date().toISOString()
    });
});

// =================== LANCEMENT ===================
app.listen(PORT, () => {
    console.log('==============================');
    console.log(`✅ SERVEUR LANCÉ SUR LE PORT ${PORT}`);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
