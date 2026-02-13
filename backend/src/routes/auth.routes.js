const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    updateUser,
    deleteUser,
    getAdmins
} = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

router.post('/register', registerUser);
router.post('/verify-otp', require('../controllers/auth.controller').verifyOtp);
router.post('/resend-otp', require('../controllers/auth.controller').resendOtp);
router.post('/forgot-password', require('../controllers/auth.controller').forgotPassword);
router.post('/validate-reset-otp', require('../controllers/auth.controller').validateResetOtp);
router.post('/reset-password', require('../controllers/auth.controller').resetPassword);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, require('../controllers/auth.controller').updateProfile);
router.delete('/users/:id', protect, authorize('SYSTEM_ADMIN'), deleteUser);
router.put('/users/:id', protect, authorize('SYSTEM_ADMIN'), updateUser);
router.get('/admins', protect, getAdmins);

module.exports = router;
