const axios = require('axios');
require('dotenv').config();

const test = async () => {
    // Generate a valid token for a test user or just run the mongoose query directly
    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);
    const Feedback = require('./src/models/Feedback.model');
    const rankings = await Feedback.aggregate([
            { $match: { status: { $ne: 'deleted' }, clubId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$clubId',
                    totalFeedback: { $sum: 1 },
                    positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
                    negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } },
                    avgRating: { $avg: '$rating' },
                    positivityScore: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$sentiment', 'positive'] }, then: 1 },
                                    { case: { $eq: ['$sentiment', 'negative'] }, then: -1 }
                                ],
                                default: 0
                            }
                        }
                    }
                }
            },
            { $sort: { positivityScore: -1, avgRating: -1 } },
            {
                $lookup: {
                    from: 'clubs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'club'
                }
            },
            { $unwind: '$club' }
    ]);
    console.log(JSON.stringify(rankings, null, 2));
    process.exit(0);
};
test();
