const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/membershipPlan.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.get('/', getPlans);
router.post('/', protect, authorize('SYSTEM_ADMIN'), createPlan);
router.put('/:id', protect, authorize('SYSTEM_ADMIN'), updatePlan);
router.delete('/:id', protect, authorize('SYSTEM_ADMIN'), deletePlan);

module.exports = router;
