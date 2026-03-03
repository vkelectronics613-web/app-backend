const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        uid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        coinBalance: {
            type: Number,
            default: 0,
        },
        referralCode: {
            type: String,
            unique: true,
        },
        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        streak: {
            currentDay: {
                type: Number,
                default: 0,
            },
            lastClaimDate: {
                type: Date,
                default: null,
            },
        },
        spin: {
            lastSpinDate: {
                type: Date,
                default: null,
            },
        },
        payoutCount: {
            type: Number,
            default: 0,
        },
        deviceId: {
            type: String,
            unique: true,
            sparse: true, // Allow multiple nulls if device tracking not immediately available
        },
        isBanned: {
            type: Boolean,
            default: false,
        },
        displayName: {
            type: String,
        },
        email: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
