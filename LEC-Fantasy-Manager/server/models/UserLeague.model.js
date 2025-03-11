const mongoose = require('mongoose');

const userLeagueSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MyLeagues',
        required: true
    },
    money: {
        type: Number,
        default: 75, // 75 million euros initially
        min: 0
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// Composite index to ensure only one entry per user and league
userLeagueSchema.index({ userId: 1, leagueId: 1 }, { unique: true });

const UserLeague = mongoose.model('UserLeague', userLeagueSchema);
module.exports = UserLeague;