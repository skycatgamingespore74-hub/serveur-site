const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Créer users.json si n'existe pas
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    }

    // Fonction pour lire les utilisateurs
    function getUsers() {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }

        // Fonction pour sauvegarder les utilisateurs
        function saveUsers(users) {
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            }

            // ================== ROUTES ==================

            // Inscription
            app.post('/register', (req, res) => {
                const { email, password, telephone } = req.body;
                    const users = getUsers();

                        if (users.find(u => u.email === email)) {
                                return res.status(400).json({ error: 'Email déjà utilisé' });
                                    }

                                        const newUser = {
                                                email,
                                                        password,
                                                                telephone: telephone || '',
                                                                        page: 'connexion',
                                                                                credits: 0
                                                                                    };

                                                                                        users.push(newUser);
                                                                                            saveUsers(users);

                                                                                                res.json({ success: true, user: newUser });
                                                                                                });

                                                                                                // Connexion
                                                                                                app.post('/login', (req, res) => {
                                                                                                    const { email, password } = req.body;
                                                                                                        const users = getUsers();

                                                                                                            const user = users.find(u => u.email === email && u.password === password);
                                                                                                                if (!user) {
                                                                                                                        return res.status(400).json({ error: 'Email ou mot de passe incorrect' });
                                                                                                                            }

                                                                                                                                res.json({ success: true, user });
                                                                                                                                });

                                                                                                                                // Mettre à jour les infos utilisateur
                                                                                                                                app.post('/update', (req, res) => {
                                                                                                                                    const { email, newEmail, newPassword, newTelephone, page } = req.body;
                                                                                                                                        const users = getUsers();

                                                                                                                                            const user = users.find(u => u.email === email);
                                                                                                                                                if (!user) return res.status(400).json({ error: 'Utilisateur non trouvé' });

                                                                                                                                                    if (newEmail) user.email = newEmail;
                                                                                                                                                        if (newPassword) user.password = newPassword;
                                                                                                                                                            if (newTelephone) user.telephone = newTelephone;
                                                                                                                                                                if (page) user.page = page;

                                                                                                                                                                    saveUsers(users);
                                                                                                                                                                        res.json({ success: true, user });
                                                                                                                                                                        });

                                                                                                                                                                        // Récupérer les infos d’un utilisateur
                                                                                                                                                                        app.get('/user/:email', (req, res) => {
                                                                                                                                                                            const users = getUsers();
                                                                                                                                                                                const user = users.find(u => u.email === req.params.email);
                                                                                                                                                                                    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
                                                                                                                                                                                        res.json(user);
                                                                                                                                                                                        });

                                                                                                                                                                                        // Acheter des crédits
                                                                                                                                                                                        app.post('/buy-credits', (req, res) => {
                                                                                                                                                                                            const { email, amount } = req.body;
                                                                                                                                                                                                if (!email || !amount) return res.status(400).json({ error: 'Email et montant requis' });

                                                                                                                                                                                                    const users = getUsers();
                                                                                                                                                                                                        const user = users.find(u => u.email === email);
                                                                                                                                                                                                            if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

                                                                                                                                                                                                                user.credits += amount;
                                                                                                                                                                                                                    saveUsers(users);

                                                                                                                                                                                                                        res.json({ success: true, credits: user.credits });
                                                                                                                                                                                                                        });

                                                                                                                                                                                                                        // ================== SERVEUR ==================
                                                                                                                                                                                                                        app.listen(PORT, () => {
                                                                                                                                                                                                                            console.log(`✅ Back-end lancé sur http://localhost:${PORT}`);
                                                                                                                                                                                                                            });