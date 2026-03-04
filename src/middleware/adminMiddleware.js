const isAdminUser = (req, res, next) => {
    try {
        const secret = req.headers['x-admin-secret'];
        if (!process.env.ADMIN_SECRET) {
            console.warn("ADMIN_SECRET not set in backend .env!");
        }

        if (secret && secret === (process.env.ADMIN_SECRET || 'RupeeMaster2026')) {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Invalid Admin Secret' });
        }
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(500).json({ success: false, message: 'Server error in admin authorization' });
    }
};

module.exports = { isAdminUser };
