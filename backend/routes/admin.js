const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.post('/broadcast', adminController.broadcastNotification);

module.exports = router;
