const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();
const USERS_FILE = path.join(__dirname, 'users.json');

// ================== FICHIER USERS ==================
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

// ================== ROUTES AUTH ==================

// REGISTER
router.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    console.log('📝 Tentative inscription', email);

    const users = getUsers();
    if (users.find(u => u.email === email)) {
        console.log('❌ Email déjà utilisé:', email);
        return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const newUser = { email, password, telephone: telephone || '', credits: 0 };
    users.push(newUser);
    saveUsers(users);

    console.log('✅ Utilisateur créé:', email);
    res.json({ success: true, user: newUser });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('🔐 Tentative connexion', email);

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        console.log('❌ Email ou mot de passe incorrect:', email);
        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken();
    tokens[token] = email;
    console.log('✅ Connexion réussie:', email, 'Token:', token);
    res.json({ success: true, user, token });
});

// CHECK SESSION
router.post('/check-session', (req, res) => {
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
router.post('/logout', (req, res) => {
    const { token } = req.body;
    if (tokens[token]) {
        console.log('🚪 Déconnexion de', tokens[token]);
        delete tokens[token];
    }
    res.json({ success: true });
});

// ================== ROUTES PROFILE ==================

// GET USER
router.get('/profile/:email', (req, res) => {
    const email = req.params.email;
    console.log('👤 Récupération profil de', email);

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json({ success: true, user });
});

// UPDATE USER
router.post('/profile/:email', (req, res) => {
    const email = req.params.email;
    const updates = req.body;
    console.log('✏️ Mise à jour profil de', email, updates);

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex === -1) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    res.json({ success: true, user: users[userIndex] });
});

// ================== ROUTES CREDITS ==================

// BUY CREDITS
router.post('/credits/:email', (req, res) => {
    const email = req.params.email;
    const { amount } = req.body;
    console.log('💰 Achat crédits', email, amount);

    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === email);
    if (userIndex === -1) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    users[userIndex].credits += amount;
    saveUsers(users);
    console.log('✅ Crédits ajoutés:', users[userIndex]);
    res.json({ success: true, user: users[userIndex] });
});

    // Mise à jour des crédits
    user.credits = (user.credits || 0) + creditsToAdd;
    saveUsers(users);

    console.log(`💰 ${creditsToAdd} crédits ajoutés à ${email}. Nouveau total : ${user.credits}`);
    res.json({ success: true, credits: user.credits });
});

// ================== ROUTES ADMIN ==================

// STATUS
router.get('/admin/status', (req, res) => {
    console.log('⚙️ Vérification du statut serveur (admin)');
    res.json({
        connected: true,
        message: 'Serveur actif (admin)',
        usersCount: getUsers().length,
        time: new Date().toISOString()
    });
});

// LOGS SIMPLES
router.get('/admin/logs', (req, res) => {
    console.log('📜 Requête logs admin');
    res.json({ success: true, logs: 'Logs disponibles dans console serveur' });
});

module.exports = router;
