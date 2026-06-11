const http = require('https');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User.model');
const loadEnv = require('./config/env');

loadEnv();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: 'CLUB_ADMIN' });
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    const req = http.request({
        hostname: 'clubchain-backend.vercel.app',
        path: '/api/membership-plans?clubId=[object%20Object]',
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + token }
    }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Status:', res.statusCode, 'Data:', data);
            process.exit(0);
        });
    });
    req.end();
}
run();
