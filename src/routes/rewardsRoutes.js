const express = require('express');
const { claimDailyStreak, executeLuckySpin } = require('../controllers/rewardsController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { detectFraud } = require('../middleware/fraudMiddleware');

const router = express.Router();

router.use(detectFraud);
router.use(verifyFirebaseToken);

// Claim daily streak
router.post('/streak', claimDailyStreak);

// Execute lucky spin
router.post('/spin', executeLuckySpin);

module.exports = router;
