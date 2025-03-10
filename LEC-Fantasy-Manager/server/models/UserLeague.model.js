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
        default: 75, // 75 millones al unirse
        min: 0
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// Índice compuesto para asegurar que solo haya una entrada por usuario y liga
userLeagueSchema.index({ userId: 1, leagueId: 1 }, { unique: true });

module.exports = mongoose.model('UserLeague', userLeagueSchema);