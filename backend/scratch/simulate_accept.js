const mongoose = require('mongoose');
const Task = require('../src/models/Task.model');
const IntroductionLetter = require('../src/models/IntroductionLetter.model');
const Club = require('../src/models/Club.model');
const User = require('../src/models/User.model');
require('dotenv').config({ path: '../.env' });
const jwt = require('jsonwebtoken');

async function simulateAccept() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Find an APPROVED letter
        const letter = await IntroductionLetter.findOne({ status: 'APPROVED' });
        if (!letter) {
            console.log('No APPROVED letters found to test with.');
            process.exit(0);
        }
        console.log('Testing with Letter ID:', letter._id);

        // Find the target club admin
        const admin = await User.findOne({ clubId: letter.targetClubId, role: 'CLUB_ADMIN' });
        if (!admin) {
            console.log('No admin found for target club:', letter.targetClubId);
            process.exit(0);
        }
        console.log('Testing with Admin:', admin.email);

        // Simulate the logic in acceptLetter
        console.log('Simulating acceptLetter logic...');
        
        // 1. Verify status
        if (letter.status !== 'APPROVED') {
            throw new Error('Status not APPROVED');
        }

        // 2. Verify authorization
        if (letter.targetClubId.toString() !== admin.clubId.toString() && admin.role !== 'SYSTEM_ADMIN') {
            throw new Error('Not authorized');
        }

        // 3. Generate QR Token
        const payload = {
            letterId: letter._id,
            memberId: letter.memberId,
            homeClubId: letter.homeClubId,
            type: 'INTRO_LETTER'
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        console.log('Token generated');

        // 4. Update Task
        const task = await Task.findOneAndUpdate(
            { relatedId: letter._id, type: 'VISIT_CONFIRMATION' },
            { status: 'completed' }
        );
        console.log('Task update:', task ? 'Success' : 'Task not found (but continuing)');

        console.log('Simulation SUCCESS');
        process.exit(0);
    } catch (e) {
        console.error('Simulation FAILED:', e);
        process.exit(1);
    }
}

simulateAccept();
