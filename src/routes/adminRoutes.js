const express = require('express');
const { getAllUsers, updateUserBalance, getAllTransactions } = require('../controllers/adminController');
const { isAdminUser } = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes require Admin Secret Header
router.use(isAdminUser);

router.get('/users', getAllUsers);
router.post('/users/:id/balance', updateUserBalance);
router.get('/transactions', getAllTransactions);

module.exports = router;
