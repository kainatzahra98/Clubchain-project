require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Task = require('../src/models/Task.model');
const IntroductionLetter = require('../src/models/IntroductionLetter.model');
const Club = require('../src/models/Club.model');
const User = require('../src/models/User.model');

async function testFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Check recent intro letters
        const recentLetters = await IntroductionLetter.find().sort({ createdAt: -1 }).limit(1);
        if (recentLetters.length > 0) {
            const letter = recentLetters[0];
            console.log('Most recent Intro Letter ID:', letter._id);
            console.log('Status:', letter.status);
            console.log('Home Club ID:', letter.homeClubId);
            console.log('Target Club ID:', letter.targetClubId);

            // Find tasks related to this letter
            const tasks = await Task.find({ relatedId: letter._id });
            console.log(`Found ${tasks.length} tasks for this letter:`);
            tasks.forEach(t => {
                console.log(`- Task Type: ${t.type}, Club ID: ${t.clubId}, Status: ${t.status}`);
            });
        } else {
            console.log('No intro letters found');
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

testFlow();
