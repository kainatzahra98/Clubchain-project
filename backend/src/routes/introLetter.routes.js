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
    getIncomingVisitors,
    getProcessedLetters,
    notifyMemberToReRequest,
    activateLetter,
    deleteLetter
} = require('../controllers/introductionLetter.controller');

// Client routes
router.get('/test', (req, res) => res.json({ message: 'Intro Letter routes are working' }));
router.post('/request', protect, authorize('CLIENT'), requestLetter);
router.get('/my', protect, authorize('CLIENT'), getMyLetters);
router.delete('/:id', protect, authorize('CLIENT', 'SYSTEM_ADMIN'), (req, res, next) => {
    console.log(`[DELETE DEBUG] ID: ${req.params.id}`);
    deleteLetter(req, res, next);
});

// Admin routes
router.get('/admin/all', protect, authorize('SYSTEM_ADMIN'), adminGetAllLetters);
router.get('/pending', protect, authorize('CLUB_ADMIN'), getPendingLetters);
router.get('/processed', protect, authorize('CLUB_ADMIN'), getProcessedLetters);
router.get('/incoming', protect, authorize('CLUB_ADMIN'), getIncomingVisitors);
router.put('/:id/status', protect, authorize('CLUB_ADMIN'), updateLetterStatus);
router.put('/:id/accept', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), acceptLetter);
router.put('/:id/activate', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), activateLetter);
router.put('/:id/reject', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), rejectLetter);
router.post('/verify', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), verifyLetter);
router.post('/:id/notify-re-request', protect, authorize('CLUB_ADMIN', 'SYSTEM_ADMIN'), notifyMemberToReRequest);

// Shared / Download
router.get('/:id/download', protect, downloadLetter);

module.exports = router;
