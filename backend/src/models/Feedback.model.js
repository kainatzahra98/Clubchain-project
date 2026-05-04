const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
        required: false // Optional for general platform feedback
    },
    type: {
        type: String,
        enum: ['bug', 'feature', 'complaint', 'general', 'praise'],
        default: 'general'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    message: {
        type: String,
        required: true
    },
    sentiment: {
        type: String,
        enum: ['positive', 'negative'],
        default: 'positive'
    },
    sentimentScore: {
        type: Number,
        default: 0.5
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'deleted'],
        default: 'pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
