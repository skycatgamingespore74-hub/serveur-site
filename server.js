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

// Railway fournit automatiquement PORT
const PORT = process.env.PORT;

const PUBLIC_URL = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : null;

if (!PUBLIC_URL) {
    console.error('❌ ERREUR : L\'URL publique Railway est introuvable !');
    console.error('⚠️ Assurez-vous que RAILWAY_PUBLIC_DOMAIN est défini dans les variables Railway.');
    process.exit(1);
}

console.log('🌍 URL serveur Railway détectée :', PUBLIC_URL);

const USERS_FILE = path.join(__dirname, 'users.json');

// ================== MIDDLEWARE ==================
app.use(cors({
    origin: PUBLIC_URL, // seulement ton front
    credentials: true   // pour permettre les cookies
}));
app.use(bodyParser.json());

// Session avec cookies
app.use(session({
    secret: 'monSecretUltraTopSecret', // change ça en production
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // mettre true si HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 jour
    }
}));

// Logger global avec temps de requête
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`➡️  ${req.method} ${req.url} | Status: ${res.statusCode} | ${duration}ms`);
    });
    next();
});

// ================== USERS FILE ==================
if (!fs.existsSync(USERS_FILE)) {
    console.log('📄 users.json introuvable → création');
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
} else {
    console.log('📄 users.json trouvé');
}

function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (err) {
        console.error('❌ Erreur lecture users.json', err);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        console.log('💾 users.json sauvegardé');
    } catch (err) {
        console.error('❌ Erreur sauvegarde users.json', err);
    }
}

// ================== ROUTES ==================

// ---- STATUS SERVEUR
app.get('/status', (req, res) => {
    console.log('✅ Vérification du statut serveur');
    res.json({
        connected: true,
        message: 'Serveur actif',
        url: PUBLIC_URL,
        time: new Date().toISOString()
    });
});

// ---- INSCRIPTION
app.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    console.log('📝 Tentative inscription', email);

    try {
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            console.log('❌ Email déjà utilisé');
            return res.status(400).json({ error: 'Email déjà utilisé' });
        }

        const newUser = { email, password, telephone: telephone || '', page: 'connexion', credits: 0 };
        users.push(newUser);
        saveUsers(users);

        console.log('✅ Utilisateur créé:', email);
        res.json({ success: true, user: newUser });
    } catch (err) {
        console.error('❌ Erreur inscription', err);
        res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
    }
});

// ---- CONNEXION
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('🔐 Tentative connexion', email);

    try {
        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            console.log('❌ Mauvais identifiants');
            return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
        }

        // Créer session
        req.session.user = { email: user.email };
        console.log('✅ Connexion réussie et session créée pour:', email);

        res.json({ success: true, user });
    } catch (err) {
        console.error('❌ Erreur connexion', err);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

// ---- GET UTILISATEUR CONNECTÉ
app.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Non connecté' });
    }

    const users = getUsers();
    const user = users.find(u => u.email === req.session.user.email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    res.json({ success: true, user });
});

// ---- LOGOUT
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('❌ Erreur déconnexion', err);
            return res.status(500).json({ error: 'Erreur serveur lors de la déconnexion' });
        }
        res.clearCookie('connect.sid'); // nom du cookie par défaut
        res.json({ success: true });
    });
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
    console.log('==============================');
    console.log('✅ SERVEUR LANCÉ SUR RAILWAY');
    console.log('🔌 Port :', PORT);
    console.log('🌍 URL PUBLIQUE À METTRE DANS LE FRONT :');
    console.log('➡️ ', PUBLIC_URL);
    console.log('➡️ ', `${PUBLIC_URL}/status`);
    console.log('==============================');
});
