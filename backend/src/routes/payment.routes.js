const express = require('express');
const router = express.Router();
const { initiatePayment, getPayments } = require('../controllers/payment.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const Payment = require('../models/Payment.model');
const Membership = require('../models/Membership.model');
const Club = require('../models/Club.model');
const User = require('../models/User.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const Notification = require('../models/Notification.model');

router.post('/create-session', protect, authorize('CLIENT'), initiatePayment);
router.get('/', protect, getPayments);

// Test endpoint to manually complete payment (for development/testing only)
router.post('/test-complete/:paymentId', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.paymentId);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        
        // Load data early
        const user = await User.findById(payment.userId);
        const club = await Club.findById(payment.clubId);
        const plan = await MembershipPlan.findById(payment.planId);

        // Simulate webhook by updating payment status
        payment.status = 'succeeded';
        await payment.save();
        
        // Create membership (Always create a new record to support multiple active plans as requested)
        const durationMonths = plan?.durationMonths || 12;
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);
        
        const membership = await Membership.create({
            userId: payment.userId,
            clubId: payment.clubId,
            planId: payment.planId,
            status: 'active',
            expiresAt
        });

        await Club.findByIdAndUpdate(payment.clubId, { 
            $inc: { 
                'stats.membersCount': 1,
                'stats.totalRevenue': payment.amount || 0
            } 
        });
        
        await User.findByIdAndUpdate(payment.userId, { status: 'ACTIVE' });
        
        // Notify System Admin (via Task)
        const Task = require('../models/Task.model');
        await Task.create({
            title: 'New Membership Payment',
            description: `User ${user?.name || payment.userId} paid $${payment.amount} for ${plan?.title || 'a plan'} in club ${club?.name || payment.clubId}.`,
            clubId: payment.clubId,
            type: 'NOTIFICATION',
            relatedId: payment._id,
            relatedModel: 'Payment'
        });
        
        // Send notifications
        // Notify client
        await Notification.create({
            userId: payment.userId,
            type: 'success',
            title: 'Payment Successful',
            message: `Your membership for ${plan?.title || 'the club'} is now active!`,
            relatedId: payment.clubId
        });
        
        // Notify club admin
        const clubAdmin = await User.findOne({ clubId: payment.clubId, role: 'CLUB_ADMIN' });
        if (clubAdmin) {
            await Notification.create({
                userId: clubAdmin._id,
                type: 'info',
                title: 'New Member Joined',
                message: `${user?.name || 'A new member'} purchased ${plan?.title || 'a membership'} plan for your club ${club?.name || ''}.`,
                relatedId: payment.clubId
            });
        }
        
        res.json({ message: 'Payment completed successfully', payment, membership });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Note: webhook is handled directly in app.js with raw body parsing

module.exports = router;
