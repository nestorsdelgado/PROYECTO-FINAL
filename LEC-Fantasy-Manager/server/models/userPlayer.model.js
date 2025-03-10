const mongoose = require('mongoose');

const userPlayerSchema = new mongoose.Schema({
    playerId: {
        type: String,
        required: true
    },
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
    purchaseDate: {
        type: Date,
        default: Date.now
    }
});

// Compuesto único para evitar compras duplicadas
userPlayerSchema.index({ playerId: 1, userId: 1, leagueId: 1 }, { unique: true });

module.exports = mongoose.model('UserPlayer', userPlayerSchema);