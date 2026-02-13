const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
