const User = require('../models/User');
const Transaction = require('../models/Transaction');
const GlobalConfig = require('../models/GlobalConfig');

// Utility to create transaction
const createTx = async (userId, type, amount, source, description) => {
    await Transaction.create({
        user: userId,
        type,
        amount,
        source,
        description
    });
};

// Rate Limiter Memory Map to prevent double-click React Native bridge duplication bugs
const minesweeperLocks = new Map();

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

        await createTx(userId, 'EARN', rewardCoins, 'STREAK', `Daily Streak Day ${currentDay}`);

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

        const globalConfig = await GlobalConfig.findOne() || { jackpotProbability: 10 };

        if (user.spin.count >= 10) {
            return res.status(400).json({ success: false, message: 'Daily limit of 10 spins reached.' });
        }

        // Spin Wheel Prize Pool logic based on Global Jackpot Probability
        const isJackpot = Math.random() < (globalConfig.jackpotProbability / 100);

        let finalPrize = 0;
        if (isJackpot) {
            finalPrize = 50; // Max prize
        } else {
            const normalPrizes = [1, 2, 3, 5, 10, 15, 20];
            finalPrize = normalPrizes[Math.floor(Math.random() * normalPrizes.length)];
        }

        user.coinBalance += finalPrize;
        user.spin.count += 1;
        user.spin.lastSpinDate = now;
        await user.save();

        await createTx(userId, 'EARN', finalPrize, 'SPIN', 'Lucky Spin');

        res.json({ success: true, prize: finalPrize, count: user.spin.count, message: `You won ${finalPrize} coins!` });

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

        const globalConfig = await GlobalConfig.findOne() || { dailyAdLimitUser: 20 };

        const now = new Date();
        const lastReset = user.lastAdReset;

        // Reset daily ad views if it's a new day
        if (lastReset) {
            const lastResetDay = new Date(lastReset).setHours(0, 0, 0, 0);
            const today = new Date().setHours(0, 0, 0, 0);

            if (today > lastResetDay) {
                user.adViewsToday = 0;
            }
        }

        // Enforce Ad Limit cap
        if (user.adViewsToday >= globalConfig.dailyAdLimitUser) {
            return res.status(403).json({ success: false, message: `Daily Ad Limit of ${globalConfig.dailyAdLimitUser} reached. Come back tomorrow!` });
        }

        const reward = 10; // 10 coins per ad
        user.coinBalance += reward;
        user.adViewsToday += 1;
        user.lastAdReset = now;
        await user.save();

        await createTx(userId, 'EARN', reward, 'WATCH_AD', 'Watch Ad Video');

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

        await createTx(userId, 'EARN', reward, 'LUDO_WIN', 'Ludo Victory');

        res.json({ success: true, reward, message: `Winner! You earned ${reward} coins.` });
    } catch (error) {
        console.error("Ludo Result Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 5. Turbo Racer Result
exports.submitTurboRacerResult = async (req, res) => {
    try {
        const { distance } = req.body;
        const userId = req.user.userId;

        if (!distance || distance < 500) {
            return res.json({ success: true, reward: 0, message: 'Keep driving! Earn coins starting at 500m.' });
        }

        const user = await User.findById(userId);

        // Anti-Cheat: Backend recalculates coins based strictly on raw distance
        const reward = Math.floor(distance / 500);

        user.coinBalance += reward;
        await user.save();

        await createTx(userId, 'EARN', reward, 'TURBO_RACER', `Turbo Racer Run (${Math.floor(distance)}m)`);

        res.json({ success: true, reward, message: `Race Over! You earned ${reward} coins.` });
    } catch (error) {
        console.error("Turbo Racer Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 6. Minesweeper Result
exports.submitMinesweeperResult = async (req, res) => {
    try {
        const { action, amount } = req.body;
        const userId = req.user.userId;

        if (!action || amount === undefined || amount < 0) {
            return res.status(400).json({ success: false, message: 'Invalid payload' });
        }

        // --- Prevent Double Click / Race Condition Bug ---
        const lastReqTime = minesweeperLocks.get(userId);
        if (lastReqTime && (Date.now() - lastReqTime < 2000)) {
            return res.status(429).json({ success: false, message: 'Processing... please wait.' });
        }
        minesweeperLocks.set(userId, Date.now());
        // -------------------------------------------------

        const user = await User.findById(userId);

        if (action === 'BET') {
            if (amount > 80) return res.status(400).json({ success: false, message: 'Maximum bet is 80 coins.' });
            if (user.coinBalance < amount) return res.status(400).json({ success: false, message: 'Insufficient balance.' });

            user.coinBalance -= amount;
            await user.save();
            await createTx(userId, 'SPEND', amount, 'MINESWEEPER', `Minesweeper Bet (-${amount} coins)`);

            return res.json({ success: true, newBalance: user.coinBalance, message: 'Bet placed successfully.' });
        } else if (action === 'WIN') {
            user.coinBalance += amount;
            await user.save();
            await createTx(userId, 'EARN', amount, 'MINESWEEPER', `Minesweeper Win (+${amount} coins)`);

            return res.json({ success: true, newBalance: user.coinBalance, message: `Secured ${amount} coins!` });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action type' });
        }
    } catch (error) {
        console.error("Minesweeper Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// 7. Scratch & Earn
exports.executeScratchEarn = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const globalConfig = await GlobalConfig.findOne() || { jackpotProbability: 10 };

        // Prize Pool: controlled dynamically by admin's jackpot variable
        const isLucky = Math.random() < (globalConfig.jackpotProbability / 100);
        let prize = 0;
        if (isLucky) {
            prize = Math.floor(Math.random() * (25 - 15 + 1)) + 15; // 15 to 25
        } else {
            prize = Math.floor(Math.random() * (10 - 4 + 1)) + 4; // 4 to 10
        }

        user.coinBalance += prize;
        await user.save();

        await createTx(userId, 'EARN', prize, 'SCRATCH', 'Scratch & Earn');

        res.json({ success: true, prize, message: `You scratched and won ${prize} coins!` });

    } catch (error) {
        console.error("Scratch Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
