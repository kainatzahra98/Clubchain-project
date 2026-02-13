const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth.middleware');
const {
    requestLetter,
    getMyLetters,
    getPendingLetters,
    updateLetterStatus,
    downloadLetter,
    verifyLetter,
    acceptLetter,
    rejectLetter,
    adminGetAllLetters,
    getIncomingVisitors
} = require('../controllers/introductionLetter.controller');

// Client routes
router.post('/request', protect, authorize('CLIENT'), requestLetter);
router.get('/my', protect, authorize('CLIENT'), getMyLetters);

// Admin routes
router.get('/admin/all', protect, authorize('SYSTEM_ADMIN'), adminGetAllLetters);
router.get('/pending', protect, authorize('CLUB_ADMIN'), getPendingLetters);
router.get('/incoming', protect, authorize('CLUB_ADMIN'), getIncomingVisitors);
router.put('/:id/status', protect, authorize('CLUB_ADMIN'), updateLetterStatus);
router.put('/:id/accept', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), acceptLetter);
router.put('/:id/reject', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), rejectLetter);
router.post('/verify', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), verifyLetter);

// Shared / Download
router.get('/:id/download', protect, downloadLetter);

module.exports = router;
