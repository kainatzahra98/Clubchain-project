const express = require('express');
const router = express.Router();
const {
    submitFeedback,
    getFeedback,
    updateFeedback,
    deleteFeedback,
    notifyAssignee,
    restoreFeedback,
    permanentDeleteFeedback,
    getClubRankings
} = require('../controllers/feedback.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.get('/rankings', protect, getClubRankings); // accessible to all logged-in users
router.post('/', protect, authorize('CLIENT'), submitFeedback);
router.get('/', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), getFeedback);
router.put('/:id', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), updateFeedback);
router.delete('/:id', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), deleteFeedback);
router.post('/:id/notify', protect, authorize('SYSTEM_ADMIN'), notifyAssignee);
router.put('/:id/restore', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), restoreFeedback);
router.delete('/:id/permanent', protect, authorize('SYSTEM_ADMIN'), permanentDeleteFeedback);

module.exports = router;
