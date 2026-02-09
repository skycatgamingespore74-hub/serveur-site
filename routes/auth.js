const express = require('express');
const fs = require('fs');
const path = require('path');
const { generateToken, verifyToken, deleteToken } = require('../utils/token');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../data/users.json');

// ================== Helpers ==================
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));

function getUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch { return []; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================== ROUTES ==================

// REGISTER
router.post('/register', (req, res) => {
    const { email, password, telephone } = req.body;
    const users = getUsers();
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email déjà utilisé' });

    const newUser = { email, password, telephone: telephone || '', credits: 0 };
    users.push(newUser);
    saveUsers(users);
    res.json({ success: true, user: newUser });
});

// LOGIN
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ error: 'Email ou mot de passe incorrect' });

    const token = generateToken(email);
    res.json({ success: true, user, token });
});

// CHECK SESSION
router.post('/check-session', (req, res) => {
    const { token } = req.body;
    const email = verifyToken(token);
    if (email) res.json({ success: true, email });
    else res.json({ success: false });
});

// LOGOUT
router.post('/logout', (req, res) => {
    const { token } = req.body;
    deleteToken(token);
    res.json({ success: true });
});

module.exports = router;
