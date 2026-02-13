const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MembershipPlan',
        required: false // Optional for legacy records
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'expired', 'inactive', 'cancelled'],
        default: 'pending'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model('Membership', membershipSchema);
