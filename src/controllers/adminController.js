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
            source: 'ADMIN_ADJUSTMENT',
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
        // Populate the username & email from User coll to display who did what
        const txs = await Transaction.find({})
            .populate('user', 'displayName email referralCode')
            .sort({ createdAt: -1 })
            .limit(1000); // hard cap to prevent catastrophic DB load

        res.status(200).json({ success: true, count: txs.length, data: txs });
    } catch (error) {
        console.error('Admin getAllTransactions Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Transactions' });
    }
};

module.exports = {
    getAllUsers,
    updateUserBalance,
    getAllTransactions
};
