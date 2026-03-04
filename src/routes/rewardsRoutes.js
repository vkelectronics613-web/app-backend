const express = require('express');
const { claimDailyStreak, executeLuckySpin, submitLudoResult, executeWatchAd, submitTurboRacerResult, submitMinesweeperResult } = require('../controllers/rewardsController');
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

// Watch Ad to earn coins
router.post('/watch-ad', executeWatchAd);

// Submit Turbo Racer Result
router.post('/turbo-racer', submitTurboRacerResult);

// Submit Minesweeper Result
router.post('/minesweeper', submitMinesweeperResult);

module.exports = router;
