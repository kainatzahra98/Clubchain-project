const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: String,
        required: true
    },
    durationMonths: {
        type: Number,
        required: true,
        default: 12
    },
    description: {
        type: String,
        required: true
    },
    features: [{
        type: String
    }],
    icon: {
        type: String,
        default: 'FaStar'
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
