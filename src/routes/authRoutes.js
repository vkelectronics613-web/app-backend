const express = require('express');
const { loginUser, getUserProfile, enterReferralCode, getGlobalAppConfig } = require('../controllers/authController');
const { getMyNotifications, clearMyNotifications } = require('../controllers/notificationController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { detectFraud } = require('../middleware/fraudMiddleware');

const router = express.Router();

// Apply anti-fraud globally or to specific routes
router.use(detectFraud);

// Login or Register via Firebase
router.post('/login', verifyFirebaseToken, loginUser);

// Get User Profile
router.get('/profile', verifyFirebaseToken, getUserProfile);

// Notification Inbox endpoints for standard users
router.get('/notifications', verifyFirebaseToken, getMyNotifications);
router.delete('/notifications', verifyFirebaseToken, clearMyNotifications);

// Enter Referral Code Post-Signup
router.post('/enter-referral-code', verifyFirebaseToken, enterReferralCode);

// Public Config Fetch
router.get('/config', getGlobalAppConfig);

module.exports = router;
