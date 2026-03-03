const express = require('express');
const { getWalletHistory, requestPayout } = require('../controllers/walletController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { detectFraud } = require('../middleware/fraudMiddleware');

const router = express.Router();

router.use(detectFraud);
router.use(verifyFirebaseToken);

// Get transaction history
router.get('/history', getWalletHistory);

// Request a payout
router.post('/payout', requestPayout);

module.exports = router;
