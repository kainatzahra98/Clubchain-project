const mongoose = require('mongoose');
const User = require('./src/models/User.model');
const Club = require('./src/models/Club.model');
const Feedback = require('./src/models/Feedback.model');
require('dotenv').config();

const seedFeedback = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const user = await User.findOne({ role: 'CLIENT' });
        const club = await Club.findOne();

        if (!user || !club) {
            console.error('Initial data (user/club) not found. Please seed main data first.');
            process.exit(1);
        }

        const feedbackItems = [
            {
                userId: user._id,
                clubId: club._id,
                type: 'bug',
                rating: 2,
                message: 'The mobile app crashes when I try to book a court. Very frustrating!',
                sentiment: 'negative',
                sentimentScore: 0.85,
                status: 'pending'
            },
            {
                userId: user._id,
                clubId: club._id,
                type: 'feature',
                rating: 5,
                message: 'I love the new layout! It would be even better if we could see a history of our payments.',
                sentiment: 'positive',
                sentimentScore: 0.92,
                status: 'pending'
            },
            {
                userId: user._id,
                clubId: club._id,
                type: 'complaint',
                rating: 1,
                message: 'Wait times at the gym are ridiculous. Need more equipment.',
                sentiment: 'negative',
                sentimentScore: 0.78,
                status: 'pending'
            },
            {
                userId: user._id,
                clubId: club._id,
                type: 'general',
                rating: 4,
                message: 'The staff is very friendly and the facilities are clean.',
                sentiment: 'positive',
                sentimentScore: 0.88,
                status: 'resolved'
            }
        ];

        await Feedback.insertMany(feedbackItems);
        console.log('Feedback seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding feedback:', error);
        process.exit(1);
    }
};

seedFeedback();
