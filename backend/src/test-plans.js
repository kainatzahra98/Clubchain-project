const mongoose = require('mongoose');
const MembershipPlan = require('./models/MembershipPlan.model');
const loadEnv = require('./config/env');

loadEnv();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const plans = await MembershipPlan.find({});
    console.log(`Total plans: ${plans.length}`);
    const activePlans = plans.filter(p => p.isActive);
    console.log(`Active plans: ${activePlans.length}`);
    process.exit(0);
}
run();
