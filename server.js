const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

console.log('==============================');
console.log('🚀 DÉMARRAGE DU SERVEUR');
console.log('==============================');

const app = express();

/*
 Railway injecte automatiquement PORT
 En local → 3000
*/
const PORT = process.env.PORT || 3000;

/*
 Railway fournit aussi une URL publique
 (utile pour les logs et le front)
*/
const PUBLIC_URL =
    process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : `http://localhost:${PORT}`;

console.log('🌍 URL serveur détectée :', PUBLIC_URL);

const USERS_FILE = path.join(__dirname, 'users.json');

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(bodyParser.json());

// Logger global pour chaque requête
app.use((req, res, next) => {
    console.log(`➡️  ${req.method} ${req.url}`);
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
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('💾 users.json sauvegardé');
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
});

// ---- CONNEXION
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('🔐 Tentative connexion', email);

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        console.log('❌ Mauvais identifiants');
        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    console.log('✅ Connexion réussie:', email);
    res.json({ success: true, user });
});

// ---- UPDATE PROFIL
app.post('/update', (req, res) => {
    const { email, newEmail, newPassword, newTelephone, page } = req.body;
    console.log('✏️ Mise à jour profil', email);

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
});

// ---- GET USER
app.get('/user/:email', (req, res) => {
    const { email } = req.params;
    console.log('👤 Récupération utilisateur', email);

    const users = getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('❌ Utilisateur introuvable');
        return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(user);
});

// ---- ACHAT CRÉDITS
app.post('/buy-credits', (req, res) => {
    const { email, amount } = req.body;
    console.log('💰 Achat crédits', email, amount);

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
});

// ================== LANCEMENT ==================
app.listen(PORT, () => {
    console.log('==============================');
    console.log('✅ SERVEUR LANCÉ');
    console.log('🔌 Port :', PORT);
    console.log('🌍 URL PUBLIQUE (pour le front) :');
    console.log('➡️ ', PUBLIC_URL);
    console.log('➡️ ', `${PUBLIC_URL}/status`);
    console.log('==============================');
});
