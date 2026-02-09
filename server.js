const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');

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
app.use(cors({
    origin: '*', // ou ton front précis
    credentials: true
}));
app.use(bodyParser.json());

// ===== SESSION =====
app.use(session({
    secret: 'tonSecretUltraSecreto', // change ça pour du vrai secret
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // mettre true si HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 jour
    }
}));

// Logger global
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

// ================== ROUTES ==================

// ---- STATUS SERVEUR
app.get('/status', (req, res) => {
    res.json({ connected: true, message: 'Serveur actif', url: PUBLIC_URL, time: new Date().toISOString() });
});

// ---- INSCRIPTION
app.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    const users = getUsers();
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email déjà utilisé' });
    const newUser = { email, password, telephone: telephone || '', page: 'connexion', credits: 0 };
    users.push(newUser);
    saveUsers(users);
    res.json({ success: true, user: newUser });
});

// ---- CONNEXION AVEC SESSION
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

    // Stocker l'utilisateur dans la session
    req.session.user = { email: user.email };
    res.json({ success: true, user });
});

// ---- CHECK SESSION
app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ connected: true, user: req.session.user });
    } else {
        res.json({ connected: false });
    }
});

// ---- LOGOUT
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Erreur lors de la déconnexion' });
        res.json({ success: true });
    });
});

// ---- GET USER
app.get('/user/:email', (req, res) => {
    const { email } = req.params;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
});

// ---- UPDATE PROFIL
app.post('/update', (req, res) => {
    const { email, newEmail, newPassword, newTelephone, page } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' });

    if (newEmail) user.email = newEmail;
    if (newPassword) user.password = newPassword;
    if (newTelephone) user.telephone = newTelephone;
    if (page) user.page = page;

    saveUsers(users);
    res.json({ success: true, user });
});

// ---- ACHAT CRÉDITS
app.post('/buy-credits', (req, res) => {
    const { email, amount } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    user.credits += amount;
    saveUsers(users);
    res.json({ success: true, credits: user.credits });
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
    console.log('==============================');
    console.log('✅ SERVEUR LANCÉ SUR RAILWAY');
    console.log('🔌 Port :', PORT);
    console.log('🌍 URL PUBLIQUE :', PUBLIC_URL);
    console.log('==============================');
});
