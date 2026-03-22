const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:    { type: String, required: true },   // "YYYY-MM-DD"
    pushups: { type: Number, default: 0 },
    pullups: { type: Number, default: 0 },
    situps:  { type: Number, default: 0 },
    squats:  { type: Number, default: 0 },
}, { timestamps: true });

// One workout document per user per day (upsert on log)
workoutSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Workout', workoutSchema);
