const mongoose = require('mongoose');
const Club = require('./src/models/Club.model');
require('dotenv').config();

const listClubs = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to:", process.env.MONGODB_URI);

        const clubs = await Club.find({});
        console.log(`\nTotal Clubs Found: ${clubs.length}`);

        clubs.forEach((club, index) => {
            console.log(`${index + 1}. [${club._id}] ${club.name} (Status: ${club.status || 'undefined'})`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

listClubs();
