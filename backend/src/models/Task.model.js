const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: true
    },
    type: {
        type: String,
        enum: ['MEMBERSHIP_APPROVAL', 'INTRO_LETTER_APPROVAL', 'VISIT_CONFIRMATION', 'EVENT_APPROVAL', 'CLUB_ACTIVATION', 'NOTIFY_ASSIGNEE', 'NOTIFICATION', 'OTHER'],
        default: 'MEMBERSHIP_APPROVAL'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'relatedModel'
    },
    relatedModel: {
        type: String,
        required: true,
        enum: ['Membership', 'IntroductionLetter', 'Club', 'Event'],
        default: 'Membership'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);
