const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto'); // <-- ajouté

console.log('==============================');
console.log('🚀 DÉMARRAGE DU SERVEUR');
console.log('==============================');

const app = express();
const PORT = process.env.PORT;

const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;

if (!PUBLIC_URL) {
    console.error('❌ ERREUR : L\'URL publique Railway est introuvable !');
    process.exit(1);
}

console.log('🌍 URL serveur Railway détectée :', PUBLIC_URL);

const USERS_FILE = path.join(__dirname, 'users.json');

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`➡️  ${req.method} ${req.url} | Status: ${res.statusCode} | ${duration}ms`);
    });
    next();
});

// ================== USERS FILE ==================
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

function getUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch (err) { console.error('❌ Erreur lecture users.json', err); return []; }
}

function saveUsers(users) {
    try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); }
    catch (err) { console.error('❌ Erreur sauvegarde users.json', err); }
}

// ================== TOKEN MANAGEMENT ==================
const tokens = {}; // { token: email }

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// ================== ROUTES ==================

// STATUS
app.get('/status', (req, res) => {
    console.log('✅ Vérification du statut serveur');
    res.json({
        connected: true,
        message: 'Serveur actif',
        url: PUBLIC_URL,
        time: new Date().toISOString()
    });
});

// RACINE
app.get('/', (req, res) => {
    console.log('🏠 Accès racine /');
    res.json({ message: 'Serveur actif', url: PUBLIC_URL, time: new Date().toISOString() });
});

// REGISTER
app.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    console.log('📝 Tentative inscription', email);

    const users = getUsers();
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email déjà utilisé' });

    const newUser = { email, password, telephone: telephone || '', page: 'connexion', credits: 0 };
    users.push(newUser);
    saveUsers(users);

    console.log('✅ Utilisateur créé:', email);
    res.json({ success: true, user: newUser });
});

// LOGIN avec TOKEN
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('🔐 Tentative connexion', email);

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

    const token = generateToken();
    tokens[token] = email; // on associe token à l'utilisateur

    console.log('✅ Connexion réussie:', email, 'Token généré:', token);
    res.json({ success: true, user, token });
});

// CHECK SESSION
app.post('/check-session', (req, res) => {
    const { token } = req.body;
    const email = tokens[token];

    if (email) {
        console.log('🔍 Session valide pour', email);
        res.json({ success: true, email });
    } else {
        console.log('❌ Session invalide ou expirée');
        res.json({ success: false });
    }
});

// LOGOUT
app.post('/logout', (req, res) => {
    const { token } = req.body;
    if (tokens[token]) {
        console.log('🚪 Déconnexion de', tokens[token]);
        delete tokens[token];
    }
    res.json({ success: true });
});

// AUTRES ROUTES
// (update, get user, buy credits restent identiques, tu peux ajouter token check si tu veux)

// ERREURS NON CAPTURÉES
process.on('uncaughtException', err => console.error('❌ Exception non capturée :', err));
process.on('unhandledRejection', err => console.error('❌ Promesse rejetée non gérée :', err));

// LANCEMENT
app.listen(PORT, () => {
    console.log('==============================');
    console.log('✅ SERVEUR LANCÉ SUR RAILWAY');
    console.log('🔌 Port :', PORT);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
