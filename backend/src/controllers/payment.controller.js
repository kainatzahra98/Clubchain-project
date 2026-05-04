const Payment = require('../models/Payment.model');
const Membership = require('../models/Membership.model');
const User = require('../models/User.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const Club = require('../models/Club.model');
const Notification = require('../models/Notification.model');
const Task = require('../models/Task.model');

/**
 * @desc    Initialize membership payment
 * @route   POST /api/payments/create-session
 * @access  Private/CLIENT
 */
exports.initiatePayment = async (req, res) => {
    try {
        const { planId, clubId, successUrl, cancelUrl } = req.body;
        const userId = req.user.id;

        const plan = await MembershipPlan.findById(planId);
        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        // Clean price string (remove commas, currency symbols, etc.)
        const cleanPrice = plan.price.toString().replace(/[^\d.-]/g, '');
        const amount = parseFloat(cleanPrice);

        // Skip Stripe - create pending payment directly
        const payment = await Payment.create({
            userId,
            clubId,
            planId,
            amount: isNaN(amount) ? 0 : amount,
            stripeSessionId: 'manual_payment', 
            status: 'pending'
        });

        // Return payment ID for test completion
        res.json({ 
            success: true,
            paymentId: payment._id,
            message: 'Payment initialized. Use test-complete endpoint to finalize.'
        });
    } catch (error) {
        console.error('Initiate Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};


/**
 * @desc    Get payment history
 * @route   GET /api/payments
 * @access  Private
 */
exports.getPayments = async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'SYSTEM_ADMIN') {
            // See all
        } else if (req.user.role === 'CLUB_ADMIN') {
            query = { clubId: req.user.clubId };
        } else {
            query = { userId: req.user.id };
        }

        const payments = await Payment.find(query)
            .populate('userId', 'name email')
            .populate('clubId', 'name')
            .populate('planId', 'title')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
