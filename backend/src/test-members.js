const mongoose = require('mongoose');
const Membership = require('./models/Membership.model');
const User = require('./models/User.model');
const Club = require('./models/Club.model');
const MembershipPlan = require('./models/MembershipPlan.model');
const loadEnv = require('./config/env');

loadEnv();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log('Connected. Running query...');
        const memberships = await Membership.find({})
            .populate('userId', 'name email image')
            .populate('clubId', 'name')
            .populate('planId', 'title')
            .sort({ joinedAt: -1 });
        console.log(`Found ${memberships.length} memberships`);
        if (memberships.length > 0) {
            console.log('First membership object:', JSON.stringify(memberships[0]));
        }
    } catch(err) {
        console.error('Query failed:', err.message);
    }
    process.exit(0);
}
run();
