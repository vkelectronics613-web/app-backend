const express = require('express');
const { getAllUsers, updateUserBalance, getAllTransactions } = require('../controllers/adminController');
const { verifyFirebaseToken } = require('../middleware/authMiddleware');
const { isAdminUser } = require('../middleware/adminMiddleware');

const router = express.Router();

// All routes require both Firebase Auth AND Admin powers.
router.use(verifyFirebaseToken, isAdminUser);

router.get('/users', getAllUsers);
router.post('/users/:id/balance', updateUserBalance);
router.get('/transactions', getAllTransactions);

module.exports = router;
