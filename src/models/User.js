const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        uid: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        isAdmin: {
            type: Boolean,
            default: false
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
            count: {
                type: Number,
                default: 0,
            },
        },
        payoutCount: {
            type: Number,
            default: 0,
        },
        deviceId: {
            type: String,
            default: null, // Allow multiple nulls if device tracking not immediately available
        },
        isBanned: {
            type: Boolean,
            default: false, // Prevents all login/API access if true
        },
        vpnFlagged: {
            type: Boolean,
            default: false, // Flags suspicious routing behaviors
        },
        adViewsToday: {
            type: Number,
            default: 0, // Enforces maximum daily ad load constraints
        },
        lastAdReset: {
            type: Date,
            default: null, // Tracks when the 24h constraint rolling-window resets
        },
        notificationsClearedAt: {
            type: Date,
            default: null, // Tracks when global notifications were dismissed
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
