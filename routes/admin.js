const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');

// STATUS
router.get('/status', (req, res) => {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    res.json({
        connected: true,
        totalUsers: users.length,
        creditsDistributed: users.reduce((sum, u) => sum + (u.credits || 0), 0),
        time: new Date().toISOString()
    });
});

// LOGS
router.get('/logs', (req, res) => {
    // Ici tu peux lier les logs du serveur ou simplement renvoyer un message
    res.json({ message: 'Logs serveur (simulation)' });
});

module.exports = router;
