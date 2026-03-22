const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Either email or phone is required (validated in the route layer)
    email:            { type: String, unique: true, sparse: true },
    phone:            { type: String, unique: true, sparse: true },
    password:         { type: String, required: true },
    verificationCode: { type: String },
    verified:         { type: Boolean, default: false },
    workoutLogs:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
