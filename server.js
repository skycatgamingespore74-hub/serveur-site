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
const PORT = process.env.PORT || 8080;

// ⚠️ Railway
app.set('trust proxy', 1);

const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;

if (!PUBLIC_URL) {
    console.error('❌ ERREUR : URL publique Railway introuvable');
    process.exit(1);
}

console.log('🌍 URL serveur Railway détectée :', PUBLIC_URL);

const USERS_FILE = path.join(__dirname, 'users.json');

// ================== MIDDLEWARE ==================
app.use(cors({
    origin: [
        'http://localhost:5500', // dev local
        'http://127.0.0.1:5500',
        // 👉 AJOUTE ICI L’URL EXACTE DE TON FRONT
    ],
    credentials: true
}));

app.use(bodyParser.json());

// ================== SESSION ==================
app.use(session({
    name: 'sessionId',
    secret: 'CHANGE-MOI-CE-SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true,       // 🔥 OBLIGATOIRE SUR RAILWAY
        sameSite: 'none',   // 🔥 OBLIGATOIRE cross-site
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`➡️ ${req.method} ${req.url} | ${res.statusCode} | ${Date.now() - start}ms`);
    });
    next();
});

// ================== USERS ==================
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const saveUsers = users => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

// ================== ROUTES ==================

app.get('/status', (req, res) => {
    res.json({ connected: true, url: PUBLIC_URL });
});

app.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const newUser = { email, password, telephone: telephone || '', credits: 0 };
    users.push(newUser);
    saveUsers(users);

    req.session.user = { email };

    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(400).json({ error: 'Identifiants invalides' });
    }

    req.session.user = { email };
    res.json({ success: true });
});

app.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.json({ success: false });
    }
    res.json({ success: true, user: req.session.user });
});

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('sessionId', {
            secure: true,
            sameSite: 'none'
        });
        res.json({ success: true });
    });
});

// ================== START ==================
app.listen(PORT, () => {
    console.log('==============================');
    console.log('✅ SERVEUR LANCÉ');
    console.log('🔌 Port :', PORT);
    console.log('🌍 URL :', PUBLIC_URL);
    console.log('==============================');
});
