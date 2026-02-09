const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const creditsRoutes = require('./routes/credits');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/credits', creditsRoutes);
app.use('/admin', adminRoutes);

// Racine
app.get('/', (req, res) => res.json({ message: 'Serveur actif' }));

// Lancement
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));
