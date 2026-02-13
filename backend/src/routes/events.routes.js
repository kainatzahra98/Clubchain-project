const express = require('express');
const router = express.Router();
const {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    seedEvents
} = require('../controllers/event.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const upload = require('../middlewares/upload.middleware');

router.get('/temp-seed', seedEvents); // Temporary route for seeding

router.use(protect); // All event routes are protected

router.route('/')
    .get(getEvents)
    .post(authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), upload.single('image'), createEvent);

router.route('/:id')
    .put(authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), upload.single('image'), updateEvent)
    .delete(authorize('SYSTEM_ADMIN', 'CLUB_ADMIN'), deleteEvent);

module.exports = router;
