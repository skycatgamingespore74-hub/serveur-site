const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');

console.log('==============================');
console.log('🚀 DÉMARRAGE DU SERVEUR');
console.log('==============================');

const app = express();

// Railway fournit automatiquement PORT
const PORT = process.env.PORT;

const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;

if (!PUBLIC_URL) {
    console.error('❌ ERREUR : URL publique Railway introuvable');
    process.exit(1);
}

console.log('🌍 URL serveur Railway détectée :', PUBLIC_URL);

const USERS_FILE = path.join(__dirname, 'users.json');

// ================== SESSIONS TOKEN ==================
const sessions = {}; // token -> { email, createdAt }

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(bodyParser.json());

// Logger global
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`➡️ ${req.method} ${req.url} | ${res.statusCode} | ${Date.now() - start}ms`);
    });
    next();
});

// ================== USERS FILE ==================
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================== ROUTES ==================

// ---- STATUS SERVEUR (NE TOUCHE PAS → BARRE OK)
app.get('/status', (req, res) => {
    res.json({
        connected: true,
        message: 'Serveur actif',
        url: PUBLIC_URL,
        time: new Date().toISOString()
    });
});

// ---- RACINE
app.get('/', (req, res) => {
    res.json({ message: 'Serveur actif' });
});

// ---- INSCRIPTION
app.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    const users = getUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const newUser = {
        email,
        password,
        telephone: telephone || '',
        credits: 0
    };

    users.push(newUser);
    saveUsers(users);

    res.json({ success: true });
});

// ---- CONNEXION (TOKEN)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessions[token] = {
        email: user.email,
        createdAt: Date.now()
    };

    res.json({
        success: true,
        token,
        user: {
            email: user.email,
            credits: user.credits
        }
    });
});

// ---- CHECK CONNEXION
app.get('/me', (req, res) => {
    const token = req.headers.authorization;

    if (!token || !sessions[token]) {
        return res.json({ connected: false });
    }

    res.json({
        connected: true,
        user: sessions[token]
    });
});

// ---- LOGOUT
app.post('/logout', (req, res) => {
    const token = req.headers.authorization;
    if (token) delete sessions[token];
    res.json({ success: true });
});

// ---- GET USER
app.get('/user/:email', (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.email === req.params.email);

    if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
});

// ---- UPDATE PROFIL
app.post('/update', (req, res) => {
    const { email, newEmail, newPassword, newTelephone } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ error: 'Utilisateur non trouvé' });
    }

    if (newEmail) user.email = newEmail;
    if (newPassword) user.password = newPassword;
    if (newTelephone) user.telephone = newTelephone;

    saveUsers(users);
    res.json({ success: true });
});

// ---- ACHAT CRÉDITS
app.post('/buy-credits', (req, res) => {
    const { email, amount } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    user.credits += amount;
    saveUsers(users);
    res.json({ success: true, credits: user.credits });
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
    console.log('==============================');
    console.log('✅ SERVEUR LANCÉ SUR RAILWAY');
    console.log('🔌 Port :', PORT);
    console.log('🌍 URL :', PUBLIC_URL);
    console.log('==============================');
});
