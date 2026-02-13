const express = require('express');
const {
    getSettings,
    updateSettings,
    getPreferences,
    updatePreferences
} = require('../controllers/settings.controller');

const router = express.Router();

const { protect, authorize } = require('../middlewares/auth.middleware');

// Apply protection to all routes
router.use(protect);

// Preferences (Any Authenticated User)
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Global Settings (System Admin Only)
router.route('/')
    .get(authorize('SYSTEM_ADMIN'), getSettings)
    .put(authorize('SYSTEM_ADMIN'), updateSettings);

module.exports = router;
