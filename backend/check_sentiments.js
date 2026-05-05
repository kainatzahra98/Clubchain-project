const mongoose = require('mongoose');
require('dotenv').config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Feedback = require('./src/models/Feedback.model');
        const sentiments = await Feedback.distinct('sentiment');
        console.log('Distinct sentiments:', sentiments);
        
        const counts = await Feedback.aggregate([
            { $group: { _id: "$sentiment", count: { $sum: 1 } } }
        ]);
        console.log('Sentiment counts:', counts);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
checkData();
