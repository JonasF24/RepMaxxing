const express = require('express');
const router = express.Router();

// Mock database for demonstration purposes
let users = [];

// Signup endpoint
router.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (users.some(user => user.username === username)) {
        return res.status(400).send('User already exists');
    }
    users.push({ username, password });
    return res.status(201).send('User created');
});

// Verify endpoint
router.get('/verify', (req, res) => {
    const { username } = req.query;
    const user = users.find(user => user.username === username);
    if (user) {
        return res.status(200).send('User verified');
    }
    return res.status(404).send('User not found');
});

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        return res.status(200).send('Login successful');
    }
    return res.status(401).send('Invalid credentials');
});

// Profile endpoint
router.get('/profile', (req, res) => {
    const { username } = req.query;
    const user = users.find(user => user.username === username);
    if (user) {
        return res.status(200).json({ username: user.username });
    }
    return res.status(404).send('User not found');
});

module.exports = router;