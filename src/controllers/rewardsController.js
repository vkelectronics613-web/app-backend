const User = require('../models/User');
const Transaction = require('../models/Transaction');

const STREAK_REWARDS = {
    1: 10,
    2: 20,
    3: 30,
    4: 40,
    5: 50,
    6: 60,
    7: 70
};

const claimDailyStreak = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = new Date();
        const lastClaim = user.streak.lastClaimDate;

        let diffHours = 48; // default to missed if no last claim
        if (lastClaim) {
            const diffMs = now - lastClaim;
            diffHours = diffMs / (1000 * 60 * 60);
        }

        let newStreakDay = user.streak.currentDay;

        if (lastClaim && diffHours < 24) {
            return res.status(400).json({
                message: 'You have already claimed your reward for today. Come back tomorrow!',
                nextClaimTime: new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
            });
        } else if (!lastClaim || diffHours >= 48) {
            // Reset streak
            newStreakDay = 1;
        } else {
            // Increment streak (24h <= diff < 48h)
            newStreakDay += 1;
            if (newStreakDay > 7) {
                newStreakDay = 1; // Loop back after 7 days
            }
        }

        const rewardAmount = STREAK_REWARDS[newStreakDay];

        // Update User
        user.streak.currentDay = newStreakDay;
        user.streak.lastClaimDate = now;
        user.coinBalance += rewardAmount;
        await user.save();

        // Log Transaction
        await Transaction.create({
            user: user._id,
            type: 'EARN',
            source: 'STREAK',
            amount: rewardAmount,
            description: `Daily streak claim for day ${newStreakDay}`,
        });

        res.status(200).json({
            success: true,
            message: `Successfully claimed ${rewardAmount} coins for day ${newStreakDay}`,
            data: {
                streakDay: newStreakDay,
                rewardAmount,
                coinBalance: user.coinBalance
            }
        });

    } catch (error) {
        console.error('Streak Claim Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const executeLuckySpin = async (req, res) => {
    try {
        const { rewardedAdCompleted } = req.body;

        if (!rewardedAdCompleted) {
            return res.status(400).json({ message: 'You must watch a rewarded ad to spin.' });
        }

        const userId = req.user._id;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Spin probability logic:
        // Generate random number 1-100
        const rand = Math.floor(Math.random() * 100) + 1;
        let rewardAmount = 0;

        if (rand <= 10) {
            // 10% chance for big rewards [40, 45, 50]
            const options = [40, 45, 50];
            rewardAmount = options[Math.floor(Math.random() * options.length)];
        } else {
            // 90% chance for small rewards [5, 10, 20, 30, 35]
            const options = [5, 10, 20, 30, 35];
            rewardAmount = options[Math.floor(Math.random() * options.length)];
        }

        user.coinBalance += rewardAmount;
        await user.save();

        // Log Transaction
        await Transaction.create({
            user: user._id,
            type: 'EARN',
            source: 'SPIN',
            amount: rewardAmount,
            description: `Lucky spin reward`,
        });

        res.status(200).json({
            success: true,
            message: `You won ${rewardAmount} coins!`,
            data: {
                rewardAmount,
                coinBalance: user.coinBalance
            }
        });

    } catch (error) {
        console.error('Lucky Spin Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    claimDailyStreak,
    executeLuckySpin
};
