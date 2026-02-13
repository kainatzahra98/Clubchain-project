const mongoose = require('mongoose');
const Task = require('./src/models/Task.model');
const Membership = require('./src/models/Membership.model');
const IntroductionLetter = require('./src/models/IntroductionLetter.model');
const User = require('./src/models/User.model');
const Club = require('./src/models/Club.model');
const connectDB = require('./src/config/db');
require('dotenv').config();

const run = async () => {
    try {
        await connectDB();

        // Find a club admin to simulate
        const admin = await User.findOne({ role: 'CLUB_ADMIN' });
        if (!admin) {
            console.log('No CLUB_ADMIN found');
            process.exit(0);
        }

        console.log(`Simulating getTasks for admin in club: ${admin.clubId}`);

        const tasks = await Task.find({
            clubId: admin.clubId,
            status: 'pending'
        })
            .populate({
                path: 'relatedId',
                populate: [
                    { path: 'userId', select: 'name email' },
                    { path: 'planId', select: 'title' },
                    { path: 'memberId', select: 'name email' },
                    { path: 'targetClubId', select: 'name' }
                ]
            })
            .sort({ createdAt: -1 });

        console.log(`Found ${tasks.length} tasks`);
        if (tasks.length > 0) {
            console.log('Sample task populated relatedId:', JSON.stringify(tasks[0].relatedId, null, 2));
        }

    } catch (error) {
        console.error('DIAGNOSTIC FAILED:', error);
    } finally {
        process.exit(0);
    }
};

run();
