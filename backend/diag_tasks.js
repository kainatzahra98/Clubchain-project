const mongoose = require('mongoose');
const Task = require('./src/models/Task.model');
const connectDB = require('./src/config/db');
require('dotenv').config();

const run = async () => {
    await connectDB();
    const tasks = await Task.find({ relatedModel: { $exists: false } });
    console.log(`Found ${tasks.length} tasks without relatedModel`);
    if (tasks.length > 0) {
        console.log('Sample task without relatedModel:', tasks[0]);
    }
    process.exit(0);
};

run();
