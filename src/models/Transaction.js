const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['EARN', 'SPEND', 'PAYOUT'],
            required: true,
        },
        source: {
            type: String,
            enum: ['REFERRAL', 'STREAK', 'SPIN', 'LUDO_WIN', 'WATCH_AD', 'TURBO_RACER', 'PAYOUT_REQUEST', 'ADMIN'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            default: 'COMPLETED',
        }
    },
    {
        timestamps: true,
    }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
