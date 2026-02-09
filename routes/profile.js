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

// GET USER
router.get('/:email', (req, res) => {
    const users = getUsers();
    const user = users.find(u => u.email === req.params.email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
});

// UPDATE USER
router.put('/:email', (req, res) => {
    const { token, password, telephone } = req.body;
    const email = verifyToken(token);
    if (!email || email !== req.params.email) return res.status(403).json({ error: 'Token invalide' });

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (password) user.password = password;
    if (telephone) user.telephone = telephone;

    saveUsers(users);
    res.json({ success: true, user });
});

module.exports = router;
