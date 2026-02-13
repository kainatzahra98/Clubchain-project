const { sendSupportEmail } = require('../services/email.service');

// @desc    Contact support
// @route   POST /api/support
// @access  Public (or Private)
const contactSupport = async (req, res) => {
    try {
        const { email, message } = req.body;

        if (!email || !message) {
            return res.status(400).json({ message: 'Email and message are required' });
        }

        await sendSupportEmail(email, message);

        res.status(200).json({ message: 'Support request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    contactSupport
};
