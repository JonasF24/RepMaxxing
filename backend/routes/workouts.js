const express = require('express');
const router = express.Router();

// Mock data for workouts
let workouts = [];

// Endpoint to log a new workout
router.post('/log', (req, res) => {
    const { date, exercise, duration } = req.body;
    if (!date || !exercise || !duration) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    workouts.push({ date, exercise, duration });
    return res.status(201).json({ message: 'Workout logged successfully.', workouts });
});

// Endpoint to get workout logs
router.get('/logs', (req, res) => {
    return res.status(200).json(workouts);
});

// Endpoint to retrieve workout statistics
router.get('/stats', (req, res) => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0);
    return res.status(200).json({ totalWorkouts, totalDuration });
});

module.exports = router;