const express = require('express');
const fs = require('fs');
const path = require('path');
const { verifyToken } = require('../utils/token');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../data/users.json');

function getUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch { return []; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// BUY CREDITS
router.post('/buy', (req, res) => {
    const { token, amount } = req.body;
    const email = verifyToken(token);
    if (!email) return res.status(403).json({ error: 'Token invalide' });

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    user.credits = (user.credits || 0) + Number(amount);
    saveUsers(users);
    res.json({ success: true, credits: user.credits });
});

module.exports = router;
