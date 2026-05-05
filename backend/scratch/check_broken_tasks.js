const mongoose = require('mongoose');
const Task = require('../src/models/Task.model');
const IntroductionLetter = require('../src/models/IntroductionLetter.model');
const Membership = require('../src/models/Membership.model');
const Club = require('../src/models/Club.model');
const User = require('../src/models/User.model');
require('dotenv').config({ path: '../.env' });

async function checkTasks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const tasks = await Task.find({ status: 'pending' });
        console.log(`Found ${tasks.length} pending tasks`);

        for (const task of tasks) {
            console.log(`- Task: "${task.title}" (Type: ${task.type}, ID: ${task._id})`);
            try {
                const populated = await Task.findById(task._id).populate({
                    path: 'relatedId',
                    strictPopulate: false,
                    populate: [
                        { path: 'userId', select: 'name email', strictPopulate: false },
                        { path: 'planId', select: 'title', strictPopulate: false },
                        { path: 'memberId', select: 'name email', strictPopulate: false },
                        { path: 'targetClubId', select: 'name', strictPopulate: false }
                    ]
                });
                
                if (!populated.relatedId) {
                    console.log(`  [WARNING] relatedId is MISSING or BROKEN for model ${task.relatedModel}`);
                } else {
                    console.log(`  Population OK`);
                }
            } catch (err) {
                console.error(`  [ERROR] Task ${task._id} failed to populate:`, err.message);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Check failed:', err.message);
    }
}

checkTasks();
