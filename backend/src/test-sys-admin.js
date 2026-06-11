const http = require('https');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User.model');
const loadEnv = require('./config/env');

loadEnv();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: 'SYSTEM_ADMIN' });
    if (!admin) {
        console.log('No system admin found');
        process.exit(1);
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('Token generated for SYSTEM_ADMIN');
    
    const req = http.request({
        hostname: 'clubchain-backend.vercel.app',
        path: '/api/members/all-memberships',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode);
            console.log('Data substring:', data.substring(0, 500));
            process.exit(0);
        });
    });
    req.end();
}
run();
