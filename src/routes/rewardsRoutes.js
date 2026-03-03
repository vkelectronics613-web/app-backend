const express = require('express');
const { claimDailyStreak, executeLuckySpin, submitLudoResult } = require('../controllers/rewardsController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { detectFraud } = require('../middleware/fraudMiddleware');

const router = express.Router();

router.use(detectFraud);
router.use(verifyFirebaseToken);

// Claim daily streak
router.post('/streak', claimDailyStreak);

// Execute lucky spin
router.post('/spin', executeLuckySpin);

// Submit Ludo Result (Frontend Engine)
router.post('/ludo-result', submitLudoResult);

module.exports = router;
