const mongoose = require('mongoose');

const globalConfigSchema = new mongoose.Schema({
    // Enforces Singleton Pattern structurally
    type: {
        type: String,
        default: 'GLOBAL',
        unique: true
    },
    jackpotProbability: {
        type: Number,
        default: 10, // 10% chance out of 100 for high-value rewards
        min: 0,
        max: 100
    },
    dailyAdLimitUser: {
        type: Number,
        default: 20, // Max rewarded ads one user can trigger per day
        min: 1
    },
    coinsPerRupee: {
        type: Number,
        default: 80, // Equation: 80 coins = 1 INR
        min: 1
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GlobalConfig', globalConfigSchema);
