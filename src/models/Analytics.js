const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true // One daily aggregated document
    },
    totalUsersActive: {
        type: Number,
        default: 0
    },
    dailyCoinLiabilities: {
        type: Number,
        default: 0 // New coins generated to users on this day
    },
    dailyCoinBurn: {
        type: Number,
        default: 0 // Coins destroyed via payouts on this day
    },
    features: {
        spin: {
            uses: { type: Number, default: 0 },
            coinsGiven: { type: Number, default: 0 }
        },
        scratch: {
            uses: { type: Number, default: 0 },
            coinsGiven: { type: Number, default: 0 }
        },
        watchAd: {
            uses: { type: Number, default: 0 },
            coinsGiven: { type: Number, default: 0 }
        },
        minesweeper: {
            uses: { type: Number, default: 0 },
            coinsGiven: { type: Number, default: 0 }
        },
        turboRacer: {
            uses: { type: Number, default: 0 },
            coinsGiven: { type: Number, default: 0 }
        }
    },
    estimatedAdRevenueUSD: {
        type: Number,
        default: 0.0 // Based on static eCPM * (total features uses)
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Analytics', analyticsSchema);
