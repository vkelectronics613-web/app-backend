const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Send a notification (Global broadcast or to a specific user)
// @route   POST /api/v1/admin/notifications
// @access  Private/Admin
const sendNotification = async (req, res) => {
    try {
        const { title, message, userEmail } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and Message are required' });
        }

        let targetUserId = null;

        // If an email is provided, we send it directly to that user
        if (userEmail && userEmail.trim() !== '') {
            const user = await User.findOne({ email: userEmail.trim() });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found with that email' });
            }
            targetUserId = user._id;
        }

        const notification = await Notification.create({
            user: targetUserId, // null means global broadcast
            title,
            message
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: targetUserId ? 'Notification sent to user' : 'Global broadcast sent'
        });

    } catch (error) {
        console.error('Send Notification Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Sending Notification' });
    }
};

// @desc    Get notifications for the logged-in user
// @route   GET /api/v1/notifications
// @access  Private (User)
const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch notifications specific to the user OR global broadcasts (user: null)
        const notifications = await Notification.find({
            $or: [
                { user: userId },
                { user: null }
            ]
        }).sort({ createdAt: -1 }).limit(50); // limit to 50 most recent

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });

    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Notifications' });
    }
};

// @desc    Clear notifications for the logged in user
// @route   DELETE /api/v1/notifications
// @access  Private (User)
const clearMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        // Delete notifications hardcoded exactly to this user
        // Note: This does not delete global broadcasts from the DB, just direct ones.
        // To "clear" globals per-user, we need a complex viewed array, but for now we simply delete specific ones.
        await Notification.deleteMany({ user: userId });

        res.status(200).json({
            success: true,
            message: 'Personal notifications cleared'
        });

    } catch (error) {
        console.error('Clear Notifications Error:', error);
        res.status(500).json({ success: false, message: 'Server Error Clearing Notifications' });
    }
};

module.exports = {
    sendNotification,
    getMyNotifications,
    clearMyNotifications
};
