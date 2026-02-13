const express = require('express');
const router = express.Router();
const { getClubs, getClub, createClub, updateClub, addAffiliate, removeAffiliate, approveClub } = require('../controllers/club.controller');
const { joinClub } = require('../controllers/member.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.get('/', getClubs);
router.get('/:id', getClub);
router.post('/', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), createClub);
router.put('/:id', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), updateClub);
router.put('/:id/activate', protect, authorize('SYSTEM_ADMIN'), approveClub);
router.post('/:id/join', protect, authorize('CLIENT'), joinClub);

router.post('/:id/affiliate', protect, authorize('CLUB_ADMIN'), addAffiliate);
router.delete('/:id/affiliate/:targetId', protect, authorize('CLUB_ADMIN'), removeAffiliate);

module.exports = router;
