const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const User = require('../models/User');

// Rate limiter: 60 requests per 15 minutes per IP (covers normal workout logging)
const workoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests, please try again later.' },
});

// POST /api/workouts/log  — upsert today's workout for the authenticated user
router.post('/log', workoutLimiter, auth, async (req, res) => {
    const { date, pushups = 0, pullups = 0, situps = 0, squats = 0 } = req.body;
    if (!date) {
        return res.status(400).json({ msg: 'date is required' });
    }
    try {
        const workout = await Workout.findOneAndUpdate(
            { userId: req.user.id, date },
            { pushups, pullups, situps, squats },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        // Keep user's workoutLogs reference array in sync
        await User.findByIdAndUpdate(req.user.id, { $addToSet: { workoutLogs: workout._id } });
        return res.status(200).json({ msg: 'Workout logged', workout });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/workouts/logs  — all workouts for the authenticated user
router.get('/logs', workoutLimiter, auth, async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.user.id }).sort({ date: 1 });
        return res.status(200).json(workouts);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/workouts/stats  — summary stats for the authenticated user
router.get('/stats', workoutLimiter, auth, async (req, res) => {
    try {
        const workouts = await Workout.find({ userId: req.user.id });
        const totalWorkouts = workouts.length;
        const totalReps = workouts.reduce(
            (sum, w) => sum + w.pushups + w.pullups + w.situps + w.squats, 0
        );
        return res.status(200).json({ totalWorkouts, totalReps });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
