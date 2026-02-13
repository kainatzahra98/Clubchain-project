const mongoose = require('mongoose');
const Task = require('./src/models/Task.model');
const connectDB = require('./src/config/db');
require('dotenv').config();

const run = async () => {
    try {
        await connectDB();
        const result = await Task.updateMany(
            { relatedModel: { $exists: false } },
            { $set: { relatedModel: 'Membership' } }
        );
        console.log(`Updated ${result.modifiedCount} tasks with default relatedModel 'Membership'`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
};

run();
