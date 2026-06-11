const mongoose = require('mongoose');
const Membership = require('./models/Membership.model');
const User = require('./models/User.model');
const Club = require('./models/Club.model');
const MembershipPlan = require('./models/MembershipPlan.model');
const loadEnv = require('./config/env');

loadEnv();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const memberships = await Membership.find({}).populate('userId').populate('clubId').populate('planId');
    console.log(`Total memberships: ${memberships.length}`);
    const activeMemberships = memberships.filter(m => m.status === 'active');
    console.log(`Active memberships: ${activeMemberships.length}`);
    const pendingMemberships = memberships.filter(m => m.status === 'pending');
    console.log(`Pending memberships: ${pendingMemberships.length}`);
    
    // Display some active memberships
    if (activeMemberships.length > 0) {
        console.log('Sample Active Membership:', activeMemberships[0].status, activeMemberships[0].planId?.isActive);
    }
    
    process.exit(0);
}
run();
