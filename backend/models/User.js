const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    verificationCode: { type: String },
    verified: { type: Boolean, default: false },
    workoutLogs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);