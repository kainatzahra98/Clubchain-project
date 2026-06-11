const http = require('http');

// First, we need to create a token for a CLUB_ADMIN user
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
    
    // Now make HTTP request
    const options = {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/members/all-memberships',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    };
    
    const req = http.request(options, res => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            console.log('RESPONSE:', data.substring(0, 500));
            process.exit(0);
        });
    });
    
    req.on('error', e => {
        console.error(`problem with request: ${e.message}`);
        process.exit(1);
    });
    
    req.end();
}
run();
