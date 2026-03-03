const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema(
    {
        roomCode: {
            type: String,
            unique: true,
            sparse: true, // Used mainly for private rooms
        },
        mode: {
            type: String,
            enum: ['2_PLAYER', '4_PLAYER', 'PRIVATE'],
            required: true,
        },
        status: {
            type: String,
            enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABORTED'],
            default: 'WAITING',
        },
        players: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                color: {
                    type: String,
                    enum: ['RED', 'GREEN', 'YELLOW', 'BLUE'],
                },
                rank: {
                    type: Number,
                    default: null,
                },
                isWinner: {
                    type: Boolean,
                    default: false,
                },
                payoutReceived: {
                    type: Number,
                    default: 0,
                }
            }
        ],
        prizePool: {
            type: Number,
            default: 0,
        },
        startTime: {
            type: Date,
        },
        endTime: {
            type: Date,
        },
        totalAdsWatched: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true,
    }
);

// Method to calculate ad-revenue priority and close matching later
gameRoomSchema.methods.calculatePrizePool = function (impressionCount, cpm) {
    // Revenue = (Banner impressions × estimated CPM) ÷ 1000
    // 50% of calculated revenue → converted to coins.
    // We'll calculate base coin value (e.g. 1 coin = $0.001)
    const revenueUSD = (impressionCount * cpm) / 1000;
    const coinsGenerated = Math.floor((revenueUSD / 0.001) * 0.5); // Example conversion
    this.prizePool = coinsGenerated;
    return coinsGenerated;
};

const GameRoom = mongoose.model('GameRoom', gameRoomSchema);
module.exports = GameRoom;
