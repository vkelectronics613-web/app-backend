const User = require('../models/User');

const isAdminUser = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }

        const user = await User.findById(req.user._id);

        if (user && user.isAdmin) {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Not authorized as an admin' });
        }
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(500).json({ success: false, message: 'Server error in admin authorization' });
    }
};

module.exports = { isAdminUser };
