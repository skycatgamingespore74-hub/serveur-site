const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

const USERS_FILE = path.join(__dirname, 'users.json');
const LOGS_FILE = path.join(__dirname, 'admin_logs.json');

// ================== INIT FILES ==================
if (!fs.existsSync(USERS_FILE))
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));

if (!fs.existsSync(LOGS_FILE))
    fs.writeFileSync(LOGS_FILE, JSON.stringify([]));

// ================== USERS FILE ==================
function getUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (err) {
        console.error('Erreur lecture users.json', err);
        return [];
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Erreur sauvegarde users.json', err);
    }
}

// ================== LOGS FILE ==================
function getLogs() {
    try {
        return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf8'));
    } catch (err) {
        return [];
    }
}

function saveLogs(logs) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

function addLog(message) {
    const logs = getLogs();
    if (logs.length >= 10) logs.shift();
    logs.push({ message, createdAt: new Date() });
    saveLogs(logs);
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

    if (!email || !password)
        return res.status(400).json({ error: 'Champs manquants' });

    const users = getUsers();

    if (users.find(u => u.email === email))
        return res.status(400).json({ error: 'Email déjà utilisé' });

    const newUser = {
        email,
        password,
        telephone: telephone || '',
        credits: 0,
        createdAt: new Date()
    };

    users.push(newUser);
    saveUsers(users);

    addLog(`Nouvelle inscription : ${email}`);

    res.json({ success: true, user: newUser });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: 'Champs manquants' });

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        addLog(`Échec connexion : ${email}`);
        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken();
    tokens[token] = email;

    addLog(`Connexion réussie : ${email}`);

    res.json({ success: true, user, token });
});

// CHECK SESSION
router.post('/check-session', (req, res) => {
    const { token } = req.body;
    const email = tokens[token];

    if (!email)
        return res.json({ success: false });

    res.json({ success: true, email });
});

// LOGOUT
router.post('/logout', (req, res) => {
    const { token } = req.body;

    if (tokens[token]) {
        addLog(`Déconnexion : ${tokens[token]}`);
        delete tokens[token];
    }

    res.json({ success: true });
});

// ================== ROUTES PROFILE ==================

router.get('/profile/:email', (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.email === req.params.email);

    if (!user)
        return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json({ success: true, user });
});

router.post('/profile/:email', (req, res) => {
    const users = getUsers();
    const index = users.findIndex(u => u.email === req.params.email);

    if (index === -1)
        return res.status(404).json({ error: 'Utilisateur non trouvé' });

    users[index] = { ...users[index], ...req.body, updatedAt: new Date() };
    saveUsers(users);

    addLog(`Profil mis à jour : ${req.params.email}`);

    res.json({ success: true, user: users[index] });
});

// ================== ROUTES CREDITS ==================

router.post('/credits/:email', (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0)
        return res.status(400).json({ error: 'Montant invalide' });

    const users = getUsers();
    const index = users.findIndex(u => u.email === req.params.email);

    if (index === -1)
        return res.status(404).json({ error: 'Utilisateur non trouvé' });

    users[index].credits += Number(amount);
    saveUsers(users);

    addLog(`Ajout ${amount} crédits à ${req.params.email}`);

    res.json({ success: true, user: users[index] });
});

// ================== ROUTES ADMIN ==================

router.get('/admin/status', (req, res) => {
    res.json({
        connected: true,
        usersCount: getUsers().length,
        time: new Date().toISOString()
    });
});

router.get('/admin/users', (req, res) => {
    res.json({ success: true, users: getUsers() });
});

router.get('/admin/logs', (req, res) => {
    res.json({ success: true, logs: getLogs() });
});

module.exports = router;
