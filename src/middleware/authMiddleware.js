const { admin } = require('../config/firebase');
const User = require('../models/User');

const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Attach UID and email to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
        };

        // Check if user exists in DB, fetch their ban status
        const existingUser = await User.findOne({ uid: decodedToken.uid });
        if (existingUser) {
            if (existingUser.isBanned) {
                return res.status(403).json({ message: 'Forbidden: Account is banned' });
            }
            req.user._id = existingUser._id; // Legacy mongo ID access
            req.user.userId = existingUser._id; // Standardized controller access
        }

        next();
    } catch (error) {
        console.error('Firebase Auth Error:', error.message);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Unauthorized: Token expired' });
        }
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};

module.exports = { verifyFirebaseToken };
