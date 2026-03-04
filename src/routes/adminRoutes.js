const express = require('express');
const {
    getAllUsers, updateUserBalance, getAllTransactions, getPayouts, updatePayoutStatus,
    banDevice, getGlobalConfig, updateGlobalConfig, getAnalyticsDashboard
} = require('../controllers/adminController');
const { sendNotification } = require('../controllers/notificationController');
const { isAdminUser } = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes require Admin Secret Header
router.use(isAdminUser);

router.get('/users', getAllUsers);
router.post('/users/:id/balance', updateUserBalance);
router.post('/users/ban-device', banDevice); // Police View: Network Ban

router.get('/transactions', getAllTransactions);

router.get('/payouts', getPayouts);
router.post('/payouts/:id/status', updatePayoutStatus);

router.post('/notifications', sendNotification);

// Global App Configuration (God View)
router.get('/config', getGlobalConfig);
router.put('/config', updateGlobalConfig);

// Analytics & Profit Tracker (Money View)
router.get('/analytics', getAnalyticsDashboard);

module.exports = router;
