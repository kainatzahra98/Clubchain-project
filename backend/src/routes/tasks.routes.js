const express = require('express');
const router = express.Router();
const { getTasks, handleTask, deleteTask } = require('../controllers/member.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.get('/', protect, authorize('CLUB_ADMIN'), getTasks);
router.put('/:id', protect, authorize('CLUB_ADMIN'), handleTask);
router.delete('/:id', protect, authorize('CLUB_ADMIN'), deleteTask);

module.exports = router;
