const mongoose = require('mongoose');
const Club = require('./src/models/Club.model');
const User = require('./src/models/User.model');
require('dotenv').config();

const checkCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const clubCount = await Club.countDocuments({});
        const adminCount = await User.countDocuments({ role: 'CLUB_ADMIN' });
        const allUsers = await User.find({ role: 'CLUB_ADMIN' }).select('name email clubId');

        console.log('\n--- DIAGNOSTIC RESULTS ---');
        console.log(`Frequency of Clubs: ${clubCount}`);
        console.log(`Frequency of Club Admins: ${adminCount}`);
        console.log('\nClub Admins list:');
        allUsers.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [ClubID: ${u.clubId || 'NONE'}]`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkCounts();
