const express = require('express');
const router = express.Router();
const { joinClub, getTasks, handleTask, getAllMembers, getMyClubs, deactivateMembership, getMemberStats, getMemberEvents, updateMemberNotes, getMemberDetails, getAllMemberships, activateMembership, deactivateMembershipByAdmin } = require('../controllers/member.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/my-clubs', protect, authorize('CLIENT'), getMyClubs); // Specific path first
router.put('/:clubId/deactivate', protect, authorize('CLIENT'), deactivateMembership);
router.get('/stats', protect, authorize('CLIENT'), getMemberStats);
router.get('/events', protect, authorize('CLIENT'), getMemberEvents);
router.post('/clubs/:id/join', protect, authorize('CLIENT'), joinClub);
router.put('/:id/notes', protect, authorize('CLUB_ADMIN'), updateMemberNotes);
router.get('/all-memberships', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), getAllMemberships);
// Membership activation/deactivation by admin
router.put('/:membershipId/activate', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), activateMembership);
router.put('/:membershipId/deactivate-by-admin', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), deactivateMembershipByAdmin);
router.get('/:id', protect, authorize('CLUB_ADMIN'), getMemberDetails);
router.get('/', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), getAllMembers);

module.exports = router;
