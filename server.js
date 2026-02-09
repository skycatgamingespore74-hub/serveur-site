const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

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

// Afficher toutes les variables d'environnement utiles
console.log('📋 Variables d\'environnement disponibles :');
console.log({
    PORT,
    RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
    RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME,
    RAILWAY_ENVIRONMENT_NAME: process.env.RAILWAY_ENVIRONMENT_NAME,
    RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME
});

const USERS_FILE = path.join(__dirname, 'users.json');

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(bodyParser.json());

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

// ______ conect
app.get('/', (req, res) => {
    console.log('🏠 Accès racine /');
    res.json({ message: 'Serveur actif', url: PUBLIC_URL, time: new Date().toISOString() });
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

        console.log('✅ Connexion réussie:', email);
        res.json({ success: true, user });
    } catch (err) {
        console.error('❌ Erreur connexion', err);
        res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
});

// ---- UPDATE PROFIL
app.post('/update', (req, res) => {
    const { email, newEmail, newPassword, newTelephone, page } = req.body;
    console.log('✏️ Mise à jour profil', email);

    try {
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.log('❌ Utilisateur introuvable');
            return res.status(400).json({ error: 'Utilisateur non trouvé' });
        }

        if (newEmail) user.email = newEmail;
        if (newPassword) user.password = newPassword;
        if (newTelephone) user.telephone = newTelephone;
        if (page) user.page = page;

        saveUsers(users);
        console.log('✅ Profil mis à jour:', user.email);
        res.json({ success: true, user });
    } catch (err) {
        console.error('❌ Erreur update profil', err);
        res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du profil' });
    }
});

// ---- GET USER
app.get('/user/:email', (req, res) => {
    const { email } = req.params;
    console.log('👤 Récupération utilisateur', email);

    try {
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.log('❌ Utilisateur introuvable');
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(user);
    } catch (err) {
        console.error('❌ Erreur récupération utilisateur', err);
        res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'utilisateur' });
    }
});

// ---- ACHAT CRÉDITS
app.post('/buy-credits', (req, res) => {
    const { email, amount } = req.body;
    console.log('💰 Achat crédits', email, amount);

    try {
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.log('❌ Utilisateur introuvable');
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        user.credits += amount;
        saveUsers(users);
        console.log(`✅ ${amount} crédits ajoutés à ${email}`);
        res.json({ success: true, credits: user.credits });
    } catch (err) {
        console.error('❌ Erreur achat crédits', err);
        res.status(500).json({ error: 'Erreur serveur lors de l\'achat de crédits' });
    }
});

// ---- Gestion des erreurs non capturées
process.on('uncaughtException', err => {
    console.error('❌ Exception non capturée :', err);
});
process.on('unhandledRejection', err => {
    console.error('❌ Promesse rejetée non gérée :', err);
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
