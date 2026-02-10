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

app.get('/login', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <title>Connexion</title>
    </head>
    <body>
        <h1>Connexion Admin</h1>
        <form id="loginForm">
            <input type="text" id="token" placeholder="Token" required />
            <button type="submit">Se connecter</button>
        </form>

        <script>
        document.getElementById('loginForm').addEventListener('submit', async e => {
            e.preventDefault();
            const token = document.getElementById('token').value;
            const res = await fetch('/validate-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (data.success) alert('Connexion réussie !');
            else alert('Token invalide');
        });
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

app.post('/validate-token', (req, res) => {
    const { token } = req.body;
    if (token === 'TON_TOKEN_GENERÉ_PAR_ADMIN') {
        return res.json({ success: true });
    }
    return res.json({ success: false });
});

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
