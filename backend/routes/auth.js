const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');
const { sendVerificationEmail, sendVerificationSMS } = require('../utils/email');

// Rate limiters for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests, please try again later.' },
});

const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests, please try again later.' },
});

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Signup endpoint
router.post('/signup', authLimiter, async (req, res) => {
    const { email, phone, password, passwordConfirm } = req.body;
    if (!email && !phone) {
        return res.status(400).json({ msg: 'Email or phone is required' });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({ msg: 'Password must be at least 8 characters' });
    }
    if (password !== passwordConfirm) {
        return res.status(400).json({ msg: 'Passwords do not match' });
    }
    try {
        const existing = await User.findOne({ $or: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
        ]});
        if (existing) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateCode();
        const user = new User({ email, phone, password: hashedPassword, verificationCode, verified: false });
        await user.save();

        if (email) {
            sendVerificationEmail(email, verificationCode);
        } else if (phone) {
            sendVerificationSMS(phone, `Your RepMax verification code is: ${verificationCode}`);
        }

        return res.status(201).json({ msg: 'User created. Check your email/phone for the verification code.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// Verify endpoint — POST (matches frontend fetch call)
router.post('/verify', authLimiter, async (req, res) => {
    const { email, phone, code } = req.body;
    if (!code) {
        return res.status(400).json({ msg: 'Verification code is required' });
    }
    try {
        const user = await User.findOne({
            ...(email ? { email } : { phone }),
            verificationCode: code,
        });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired code' });
        }
        user.verified = true;
        user.verificationCode = null;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
    const { email, phone, password } = req.body;
    if (!email && !phone) {
        return res.status(400).json({ msg: 'Email or phone is required' });
    }
    if (!password) {
        return res.status(400).json({ msg: 'Password is required' });
    }
    try {
        const user = await User.findOne(email ? { email } : { phone });
        if (!user) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }
        if (!user.verified) {
            return res.status(401).json({ msg: 'Account not verified. Please check your email/phone.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({ token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// Profile endpoint — protected by JWT middleware
router.get('/profile', profileLimiter, auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const workouts = await Workout.find({ userId: req.user.id }).sort({ date: 1 });
        return res.status(200).json({
            username: user.email || user.phone,
            logs: workouts.map(w => ({
                date:    w.date,
                pushups: w.pushups || 0,
                pullups: w.pullups || 0,
                situps:  w.situps  || 0,
                squats:  w.squats  || 0,
            })),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;