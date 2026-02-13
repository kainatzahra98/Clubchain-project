const mongoose = require('mongoose');

const introductionLetterSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    homeClubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    targetClubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACCEPTED', 'EXPIRED'],
        default: 'PENDING'
    },
    visitDate: {
        type: Date,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        default: 1
    },
    qrToken: {
        type: String, // JWT signed token for verification
        default: null
    },
    expiryDate: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('IntroductionLetter', introductionLetterSchema);
