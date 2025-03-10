const mongoose = require('mongoose');

const lineupPlayerSchema = new mongoose.Schema({
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
    playerId: {
        type: String,
        required: true
    },
    position: {
        type: String,
        enum: ['top', 'jungle', 'mid', 'adc', 'support'],
        required: true
    },
    matchday: {
        type: Number,
        default: 1
    }
});

// Índice compuesto para asegurar que solo haya un jugador por posición en cada jornada
lineupPlayerSchema.index({ userId: 1, leagueId: 1, position: 1, matchday: 1 }, { unique: true });

module.exports = mongoose.model('LineupPlayer', lineupPlayerSchema);