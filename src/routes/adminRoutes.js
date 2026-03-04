const express = require('express');
const { getAllUsers, updateUserBalance, getAllTransactions, getPayouts, updatePayoutStatus } = require('../controllers/adminController');
const { sendNotification } = require('../controllers/notificationController');
const { isAdminUser } = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes require Admin Secret Header
router.use(isAdminUser);

router.get('/users', getAllUsers);
router.post('/users/:id/balance', updateUserBalance);
router.get('/transactions', getAllTransactions);
router.get('/payouts', getPayouts);
router.post('/payouts/:id/status', updatePayoutStatus);
router.post('/notifications', sendNotification);

module.exports = router;
