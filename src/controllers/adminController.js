const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @desc    Get all registered users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        // Find all users, sort by creation date descending
        const users = await User.find({}).sort({ createdAt: -1 }).select('-__v');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        console.error('Admin getAllUsers Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Users' });
    }
};

// @desc    Modify a user's coin balance
// @route   POST /api/v1/admin/users/:id/balance
// @access  Private/Admin
const updateUserBalance = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body; // Amount can be positive or negative

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ success: false, message: 'Please provide a valid numeric amount' });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const parsedAmount = parseInt(amount);

        // Prevent balance from going negative
        if (userToUpdate.coinBalance + parsedAmount < 0) {
            return res.status(400).json({ success: false, message: 'Adjustment would result in negative balance' });
        }

        // Apply
        userToUpdate.coinBalance += parsedAmount;
        await userToUpdate.save();

        // Log it
        await Transaction.create({
            user: userToUpdate._id,
            type: parsedAmount >= 0 ? 'EARN' : 'SPEND',
            source: 'ADMIN',
            amount: Math.abs(parsedAmount), // Store positive magnitude
            description: reason || `Admin adjusted balance by ${parsedAmount} coins`,
        });

        res.status(200).json({ success: true, message: 'Balance updated successfully', data: userToUpdate });
    } catch (error) {
        console.error('Admin updateUserBalance Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Modifying Balance' });
    }
};

// @desc    Get all transactions across the platform
// @route   GET /api/v1/admin/transactions
// @access  Private/Admin
const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const total = await Transaction.countDocuments({});
        const txs = await Transaction.find({})
            .populate('user', 'displayName email referralCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: txs.length,
            totalPages: Math.ceil(total / limit) || 1,
            currentPage: page,
            data: txs
        });
    } catch (error) {
        console.error('Admin getAllTransactions Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Transactions' });
    }
};

// @desc    Get all payout requests
// @route   GET /api/v1/admin/payouts
// @access  Private/Admin
const getPayouts = async (req, res) => {
    try {
        const payouts = await Transaction.find({ source: 'PAYOUT_REQUEST' })
            .populate('user', 'displayName email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: payouts });
    } catch (error) {
        console.error('Admin getPayouts Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Payouts' });
    }
};

// @desc    Update a payout request status
// @route   POST /api/v1/admin/payouts/:id/status
// @access  Private/Admin
const updatePayoutStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const tx = await Transaction.findById(id);
        if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

        tx.status = status;
        await tx.save();

        res.status(200).json({ success: true, data: tx });
    } catch (error) {
        console.error('Admin updatePayoutStatus Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Updating Payout' });
    }
};

// @desc    Ban all users by Device ID
// @route   POST /api/v1/admin/users/ban-device
// @access  Private/Admin
const banDevice = async (req, res) => {
    try {
        const { deviceId } = req.body;
        if (!deviceId) return res.status(400).json({ success: false, message: 'Device ID required' });

        const result = await User.updateMany({ deviceId }, { $set: { isBanned: true } });
        res.status(200).json({ success: true, message: `Banned ${result.modifiedCount} accounts linked to device.` });
    } catch (error) {
        console.error('Admin banDevice Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Banning Device' });
    }
};

// @desc    Get Global App Configuration
// @route   GET /api/v1/admin/config
// @access  Private/Admin
const getGlobalConfig = async (req, res) => {
    try {
        let config = await require('../models/GlobalConfig').findOne({ type: 'GLOBAL' });
        if (!config) {
            config = await require('../models/GlobalConfig').create({ type: 'GLOBAL' });
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Admin getGlobalConfig Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Config' });
    }
};

// @desc    Update Global App Configuration
// @route   PUT /api/v1/admin/config
// @access  Private/Admin
const updateGlobalConfig = async (req, res) => {
    try {
        const updates = req.body;
        let config = await require('../models/GlobalConfig').findOne({ type: 'GLOBAL' });

        if (!config) {
            config = await require('../models/GlobalConfig').create({ type: 'GLOBAL', ...updates });
        } else {
            Object.assign(config, updates);
            config.updatedAt = Date.now();
            await config.save();
        }

        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Admin updateGlobalConfig Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Updating Config' });
    }
};

// @desc    Get Analytics Dashboard Data
// @route   GET /api/v1/admin/analytics
// @access  Private/Admin
const getAnalyticsDashboard = async (req, res) => {
    try {
        // Find today's analytics
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        let todayAnalytics = await require('../models/Analytics').findOne({ date: { $gte: startOfDay } });

        // Sum total user coin liabilities globally
        const liabilityAggr = await User.aggregate([
            { $group: { _id: null, totalCoins: { $sum: "$coinBalance" } } }
        ]);
        const totalCoinLiability = liabilityAggr.length > 0 ? liabilityAggr[0].totalCoins : 0;

        res.status(200).json({
            success: true,
            data: {
                today: todayAnalytics || null,
                totalCoinLiability
            }
        });
    } catch (error) {
        console.error('Admin getAnalytics Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Analytics' });
    }
};

module.exports = {
    getAllUsers,
    updateUserBalance,
    getAllTransactions,
    getPayouts,
    updatePayoutStatus,
    banDevice,
    getGlobalConfig,
    updateGlobalConfig,
    getAnalyticsDashboard
};
