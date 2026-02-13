const mongoose = require('mongoose');
const Membership = require('./src/models/Membership.model');
const Task = require('./src/models/Task.model');
const Club = require('./src/models/Club.model');
const MembershipPlan = require('./src/models/MembershipPlan.model');
const User = require('./src/models/User.model');
require('dotenv').config();

const runTest = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");

        // 1. Get or Create Dummy Data
        const user = await User.findOne() || await User.create({ name: 'Test User', email: 'test@example.com', password: 'password' });
        const club = await Club.findOne() || await Club.create({ name: 'Test Club', description: 'Test', adminId: user._id });
        const plan = await MembershipPlan.findOne() || await MembershipPlan.create({ name: 'Test Plan', price: 100, durationMonths: 12 });

        console.log(`User: ${user._id}`);
        console.log(`Club: ${club._id}`);
        console.log(`Plan: ${plan._id}`);

        // 2. Simulate Join Logic (Purchase)
        const planId = plan._id;
        const clubId = club._id;
        const userId = user._id;

        console.log("Simulating Purchase...");

        // Membership Logic
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 12);

        // Cleanup existing for test
        await Membership.deleteMany({ userId, clubId });

        const membership = await Membership.create({
            userId,
            clubId,
            planId,
            status: 'active',
            expiresAt
        });
        console.log("Membership Created:", membership._id);

        // Task Logic (This caused error before)
        const taskType = 'NOTIFICATION'; // Testing the new enum value

        console.log("Creating Task with type:", taskType);

        const task = await Task.create({
            title: 'Test Notification',
            description: 'Testing task creation',
            clubId,
            type: taskType,
            relatedId: membership._id
        });

        console.log("Task Created:", task._id);

        console.log("✅ TEST PASSED: Setup is valid.");

    } catch (error) {
        console.error("❌ TEST FAILED:", error);
        if (error.errors) {
            console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
        }
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
