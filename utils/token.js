const crypto = require('crypto');

const tokens = {}; // { token: email }

function generateToken(email) {
    const token = crypto.randomBytes(32).toString('hex');
    tokens[token] = email;
    return token;
}

function verifyToken(token) {
    return tokens[token] || null;
}

function deleteToken(token) {
    if (tokens[token]) delete tokens[token];
}

module.exports = { generateToken, verifyToken, deleteToken };
