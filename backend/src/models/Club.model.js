const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a club name'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    category: {
        type: String,
        required: [true, 'Please add a category']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    image: {
        type: String,
        default: 'default-club.jpg'
    },
    stats: {
        membersCount: { type: Number, default: 0 },
        eventsCount: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 }
    },
    affiliatedClubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club'
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'inactive'
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Club', clubSchema);
