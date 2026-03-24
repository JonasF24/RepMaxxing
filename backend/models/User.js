const mongoose = require('mongoose');

const friendRequestSchema = new mongoose.Schema({
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });

const userSchema = new mongoose.Schema({
    username:         { type: String, required: true, unique: true, trim: true, lowercase: true },
    email:            { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    password:         { type: String, required: true },
    friends:          [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests:   [friendRequestSchema],
    workoutLogs:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workout' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
