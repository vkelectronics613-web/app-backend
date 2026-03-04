const express = require('express');
const { loginUser, getUserProfile, enterReferralCode } = require('../controllers/authController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { detectFraud } = require('../middleware/fraudMiddleware');

const router = express.Router();

// Apply anti-fraud globally or to specific routes
router.use(detectFraud);

// Login or Register via Firebase
router.post('/login', verifyFirebaseToken, loginUser);

// Get User Profile
router.get('/profile', verifyFirebaseToken, getUserProfile);

// Enter Referral Code Post-Signup
router.post('/enter-referral-code', verifyFirebaseToken, enterReferralCode);

module.exports = router;
