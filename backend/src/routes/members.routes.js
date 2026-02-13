const express = require('express');
const router = express.Router();
const { joinClub, getTasks, handleTask, getAllMembers, getMyClubs, deactivateMembership, getMemberStats, getMemberEvents, updateMemberNotes, getMemberDetails } = require('../controllers/member.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/my-clubs', protect, authorize('CLIENT'), getMyClubs); // Specific path first
router.put('/:clubId/deactivate', protect, authorize('CLIENT'), deactivateMembership);
router.get('/stats', protect, authorize('CLIENT'), getMemberStats);
router.get('/events', protect, authorize('CLIENT'), getMemberEvents); // New route
router.post('/clubs/:id/join', protect, authorize('CLIENT'), joinClub);
router.put('/:id/notes', protect, authorize('CLUB_ADMIN'), updateMemberNotes);
router.get('/:id', protect, authorize('CLUB_ADMIN'), getMemberDetails);
router.get('/', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), getAllMembers);

module.exports = router;
