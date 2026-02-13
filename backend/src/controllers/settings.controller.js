const Settings = require('../models/Settings.model');
const User = require('../models/User.model');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private (System Admin)
exports.getSettings = async (req, res) => {
    try {
        // getSettings static method ensures a document always exists
        const settings = await Settings.getSettings();

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private (System Admin)
exports.updateSettings = async (req, res) => {
    try {
        let settings = await Settings.getSettings();

        settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current user preferences
// @route   GET /api/settings/preferences
// @access  Private
exports.getPreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: user.preferences || {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update current user preferences
// @route   PUT /api/settings/preferences
// @access  Private
exports.updatePreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Merge existing preferences with updates
        // If request body has 'notifications', verify it's an object and merge deeper if needed?
        // For simplicity, we assume the frontend sends the structure we expect or partial structure.

        if (req.body.notifications) {
            user.preferences.notifications = {
                ...user.preferences.notifications,
                ...req.body.notifications
            };
        }

        if (req.body.twoFactorEnabled !== undefined) {
            user.preferences.twoFactorEnabled = req.body.twoFactorEnabled;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: user.preferences
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
