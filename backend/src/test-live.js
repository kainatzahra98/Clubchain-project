const http = require('https');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User.model');
const loadEnv = require('./config/env');

loadEnv();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: 'CLUB_ADMIN' });
    if (!admin) {
        console.log('No club admin found');
        process.exit(1);
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('Token generated');
    
    // Request 1: /api/members/all-memberships
    const getMemberships = () => new Promise(resolve => {
        const req = http.request({
            hostname: 'clubchain-backend.vercel.app',
            path: '/api/members/all-memberships',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.end();
    });

    // Request 2: /api/membership-plans
    const getPlans = () => new Promise(resolve => {
        const req = http.request({
            hostname: 'clubchain-backend.vercel.app',
            path: '/api/membership-plans',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.end();
    });

    const membersRes = await getMemberships();
    console.log('\n--- Memberships API ---');
    console.log('Status:', membersRes.status);
    console.log('Response:', membersRes.data.substring(0, 500));

    const plansRes = await getPlans();
    console.log('\n--- Plans API ---');
    console.log('Status:', plansRes.status);
    console.log('Response:', plansRes.data.substring(0, 500));

    process.exit(0);
}
run();
