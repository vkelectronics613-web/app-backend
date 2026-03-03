const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Utility to create transaction
const createTx = async (userId, type, amount, source) => {
    await Transaction.create({
        user: userId,
        type,
        amount,
        source
    });
};

// 1. Daily Streak
exports.claimDailyStreak = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const now = new Date();
        let currentDay = user.streak.currentDay || 0;
        const lastClaimDate = user.streak.lastClaimDate;

        if (lastClaimDate) {
            const timeDiff = now.getTime() - lastClaimDate.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);

            if (hoursDiff < 24) {
                return res.status(400).json({ success: false, message: 'Come back tomorrow to claim your next streak.' });
            } else if (hoursDiff > 48) {
                // Streak broken
                currentDay = 1;
            } else {
                // Streak continues
                currentDay += 1;
            }
        } else {
            // First time claim
            currentDay = 1;
        }

        // Maximum 7 days logic loop visually
        if (currentDay > 7) currentDay = 1;

        const rewardCoins = currentDay * 50; // Example: Day 1=50, Day 2=100

        user.coinBalance += rewardCoins;
        user.streak.currentDay = currentDay;
        user.streak.lastClaimDate = now;
        await user.save();

        await createTx(userId, 'EARN', rewardCoins, `Daily Streak Day ${currentDay}`);

        res.json({ success: true, rewardCoins, currentDay, message: `You earned ${rewardCoins} coins!` });

    } catch (error) {
        console.error("Streak Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 2. Lucky Spin
exports.executeLuckySpin = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const now = new Date();
        const lastSpinDate = user.spin.lastSpinDate;

        // Reset spin count if it's a new day
        if (lastSpinDate) {
            const lastSpinDay = new Date(lastSpinDate).setHours(0, 0, 0, 0);
            const today = new Date().setHours(0, 0, 0, 0);

            if (today > lastSpinDay) {
                user.spin.count = 0;
            }
        }

        if (user.spin.count >= 10) {
            return res.status(400).json({ success: false, message: 'Daily limit of 10 spins reached.' });
        }

        const prize = Math.floor(Math.random() * 15) + 5; // Yield 5-20 coins randomly

        user.coinBalance += prize;
        user.spin.count += 1;
        user.spin.lastSpinDate = now;
        await user.save();

        await createTx(userId, 'EARN', prize, 'Lucky Spin');

        res.json({ success: true, prize, count: user.spin.count, message: `You won ${prize} coins!` });

    } catch (error) {
        console.error("Spin Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 3. Ad Reward
exports.executeWatchAd = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const reward = 10; // 10 coins per ad
        user.coinBalance += reward;
        await user.save();

        await createTx(userId, 'EARN', reward, 'Watch Ad Video');

        res.json({ success: true, reward, message: `You earned ${reward} coins from Ad!` });

    } catch (error) {
        console.error("Ad Reward Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 4. Ludo Result
exports.submitLudoResult = async (req, res) => {
    try {
        const { isWinner } = req.body;
        const userId = req.user.userId;

        if (!isWinner) {
            return res.json({ success: true, reward: 0, message: 'You lost. Better luck next time!' });
        }

        const user = await User.findById(userId);
        const reward = 100; // Arbitrary ludo win amount

        user.coinBalance += reward;
        await user.save();

        await createTx(userId, 'EARN', reward, 'Ludo Victory');

        res.json({ success: true, reward, message: `Winner! You earned ${reward} coins.` });
    } catch (error) {
        console.error("Ludo Result Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
