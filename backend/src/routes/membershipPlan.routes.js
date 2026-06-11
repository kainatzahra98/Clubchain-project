const express = require('express');
const router = express.Router();
const { getPlans, createPlan, createBulkPlans, updatePlan, extendPlanToClubs, deletePlan } = require('../controllers/membershipPlan.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.get('/', protect, getPlans);
router.post('/bulk', protect, authorize('SYSTEM_ADMIN'), createBulkPlans);
router.post('/:id/extend', protect, authorize('SYSTEM_ADMIN'), extendPlanToClubs);
router.post('/', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), createPlan);
router.put('/:id', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), updatePlan);
router.delete('/:id', protect, authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), deletePlan);

module.exports = router;
