const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all transactions for the user
const getWalletHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const transactions = await Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50);

        res.status(200).json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Wallet History Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Request a payout
const requestPayout = async (req, res) => {
    try {
        const { amount, paymentMethod, paymentDetails } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.coinBalance < amount) {
            return res.status(400).json({ message: 'Insufficient coin balance.' });
        }

        // Deduct balance
        user.coinBalance -= amount;

        // Stage 2 Referral Reward: 100 coins to the inviter on first payout
        if (user.payoutCount === 0 && user.referredBy) {
            const referringUser = await User.findById(user.referredBy);
            if (referringUser) {
                referringUser.coinBalance += 100;
                await referringUser.save();

                await Transaction.create({
                    user: referringUser._id,
                    type: 'EARN',
                    source: 'REFERRAL',
                    amount: 100,
                    description: `Referral milestone bonus: Invitee completed first payout`,
                });
            }
        }

        user.payoutCount += 1;
        await user.save();

        // Create transaction record
        const transaction = await Transaction.create({
            user: userId,
            type: 'PAYOUT',
            source: 'PAYOUT_REQUEST',
            amount: amount,
            description: `Requested ${amount} coins via ${paymentMethod} to [${paymentDetails}]`,
            status: 'PENDING'
        });

        res.status(200).json({
            success: true,
            message: 'Payout requested successfully. It will be credited within 24-48 hours.',
            data: transaction
        });

    } catch (error) {
        console.error('Payout Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getWalletHistory,
    requestPayout
};
