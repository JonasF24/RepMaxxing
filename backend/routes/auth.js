const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests, please try again later.' },
});

const profileLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests, please try again later.' },
});

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function sanitizeUser(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email || '',
    };
}

function calculateProgressScore(workouts) {
    if (!workouts.length) return 0;
    const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const firstTotal = first.pushups + first.pullups + first.situps + first.squats;
    const lastTotal = last.pushups + last.pullups + last.situps + last.squats;

    return Math.max(0, lastTotal - firstTotal);
}

function calculateMaxStreak(workouts) {
    if (!workouts.length) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].sort();
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(`${dates[i - 1]}T00:00:00Z`);
        const currentDate = new Date(`${dates[i]}T00:00:00Z`);
        const diffDays = Math.round((currentDate - prevDate) / 86400000);
        if (diffDays === 1) {
            currentStreak += 1;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return maxStreak;
}

router.post('/signup', authLimiter, async (req, res) => {
    const { username, email, password, passwordConfirm } = req.body;

    if (!username || username.trim().length < 3) {
        return res.status(400).json({ msg: 'Username must be at least 3 characters' });
    }
    if (!password || password.length < 8) {
        return res.status(400).json({ msg: 'Password must be at least 8 characters' });
    }
    if (password !== passwordConfirm) {
        return res.status(400).json({ msg: 'Passwords do not match' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

    try {
        const existing = await User.findOne({
            $or: [
                { username: normalizedUsername },
                ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
            ],
        });

        if (existing) {
            return res.status(400).json({ msg: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username: normalizedUsername,
            email: normalizedEmail,
            password: hashedPassword,
        });

        await user.save();
        const token = createToken(user._id);
        return res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/login', authLimiter, async (req, res) => {
    const { identity, password } = req.body;

    if (!identity) {
        return res.status(400).json({ msg: 'Username or email is required' });
    }
    if (!password) {
        return res.status(400).json({ msg: 'Password is required' });
    }

    const normalizedIdentity = identity.trim().toLowerCase();

    try {
        const user = await User.findOne({
            $or: [{ username: normalizedIdentity }, { email: normalizedIdentity }],
        });

        if (!user) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ msg: 'Invalid credentials' });
        }

        const token = createToken(user._id);
        return res.status(200).json({ token, user: sanitizeUser(user) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/profile', profileLimiter, auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const workouts = await Workout.find({ userId: req.user.id }).sort({ date: 1 });
        return res.status(200).json({
            ...sanitizeUser(user),
            logs: workouts.map(w => ({
                date: w.date,
                pushups: w.pushups || 0,
                pullups: w.pullups || 0,
                situps: w.situps || 0,
                squats: w.squats || 0,
            })),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/users/search', profileLimiter, auth, async (req, res) => {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    if (q.length < 2) {
        return res.status(200).json([]);
    }

    try {
        const users = await User.find({
            username: { $regex: q, $options: 'i' },
            _id: { $ne: req.user.id },
        })
        .select('username friends friendRequests')
        .limit(10);

        const mapped = users.map(u => {
            const friendIds = (u.friends || []).map(id => id.toString());
            const incoming = (u.friendRequests || []).find(r => r.from.toString() === req.user.id && r.status === 'pending');
            return {
                id: u._id,
                username: u.username,
                alreadyFriends: friendIds.includes(req.user.id),
                outgoingPending: !!incoming,
            };
        });

        return res.status(200).json(mapped);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/friends/request', profileLimiter, auth, async (req, res) => {
    const { toUsername } = req.body;
    if (!toUsername) {
        return res.status(400).json({ msg: 'toUsername is required' });
    }

    try {
        const sender = await User.findById(req.user.id);
        const receiver = await User.findOne({ username: toUsername.trim().toLowerCase() });

        if (!sender || !receiver) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (receiver._id.toString() === sender._id.toString()) {
            return res.status(400).json({ msg: 'Cannot friend yourself' });
        }
        if ((sender.friends || []).some(id => id.toString() === receiver._id.toString())) {
            return res.status(400).json({ msg: 'Already friends' });
        }
        const exists = (receiver.friendRequests || []).some(r => r.from.toString() === sender._id.toString() && r.status === 'pending');
        if (exists) {
            return res.status(400).json({ msg: 'Request already sent' });
        }

        receiver.friendRequests.push({ from: sender._id, status: 'pending' });
        await receiver.save();

        return res.status(201).json({ msg: 'Friend request sent' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/friends/requests', profileLimiter, auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friendRequests.from', 'username');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const pending = (user.friendRequests || [])
            .filter(r => r.status === 'pending' && r.from)
            .map(r => ({
                requestId: r._id,
                fromUsername: r.from.username,
                createdAt: r.createdAt,
            }));

        return res.status(200).json(pending);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/friends/request/:requestId/respond', profileLimiter, auth, async (req, res) => {
    const { requestId } = req.params;
    const { action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
        return res.status(400).json({ msg: 'action must be accept or reject' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const request = user.friendRequests.id(requestId);
        if (!request || request.status !== 'pending') {
            return res.status(404).json({ msg: 'Request not found' });
        }

        if (action === 'accept') {
            request.status = 'accepted';
            if (!(user.friends || []).some(id => id.toString() === request.from.toString())) {
                user.friends.push(request.from);
            }
            const sender = await User.findById(request.from);
            if (sender && !(sender.friends || []).some(id => id.toString() === user._id.toString())) {
                sender.friends.push(user._id);
                await sender.save();
            }
        } else {
            request.status = 'rejected';
        }

        await user.save();
        return res.status(200).json({ msg: `Request ${action}ed` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/friends', profileLimiter, auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'username');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        return res.status(200).json((user.friends || []).map(friend => ({
            id: friend._id,
            username: friend.username,
        })));
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/leaderboard', profileLimiter, auth, async (_req, res) => {
    try {
        const users = await User.find({}).select('username');
        const workouts = await Workout.find({}).sort({ date: 1 });

        const byUser = {};
        users.forEach(user => {
            byUser[user._id.toString()] = {
                username: user.username,
                workouts: [],
            };
        });

        workouts.forEach(w => {
            const key = w.userId.toString();
            if (byUser[key]) byUser[key].workouts.push(w);
        });

        const rows = Object.values(byUser).map(entry => {
            const prs = { pushups: 0, pullups: 0, situps: 0, squats: 0 };
            let totalReps = 0;

            entry.workouts.forEach(w => {
                prs.pushups = Math.max(prs.pushups, w.pushups || 0);
                prs.pullups = Math.max(prs.pullups, w.pullups || 0);
                prs.situps = Math.max(prs.situps, w.situps || 0);
                prs.squats = Math.max(prs.squats, w.squats || 0);
                totalReps += (w.pushups || 0) + (w.pullups || 0) + (w.situps || 0) + (w.squats || 0);
            });

            return {
                username: entry.username,
                totalReps,
                progressScore: calculateProgressScore(entry.workouts),
                maxStreak: calculateMaxStreak(entry.workouts),
                prs,
            };
        });

        const top = (list, sortFn, limit = 10) => [...list].sort(sortFn).slice(0, limit);

        return res.status(200).json({
            progress: top(rows, (a, b) => b.progressScore - a.progressScore),
            totalReps: top(rows, (a, b) => b.totalReps - a.totalReps),
            streaks: top(rows, (a, b) => b.maxStreak - a.maxStreak),
            maxPushups: top(rows, (a, b) => b.prs.pushups - a.prs.pushups),
            maxPullups: top(rows, (a, b) => b.prs.pullups - a.prs.pullups),
            maxSitups: top(rows, (a, b) => b.prs.situps - a.prs.situps),
            maxSquats: top(rows, (a, b) => b.prs.squats - a.prs.squats),
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
