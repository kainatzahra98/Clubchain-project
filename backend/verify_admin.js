const mongoose = require('mongoose');
const User = require('./src/models/User.model');
require('dotenv').config();

const verifyUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'admin@clubz.com' });
        if (user) {
            console.log('User found:', user.email);
            console.log('Role:', user.role);
            // We can't see the plain password, but we can verify if it exists
            console.log('Has password hash:', !!user.password);
        } else {
            console.log('User admin@clubz.com NOT found in database.');
            const allUsers = await User.find({}, 'email role');
            console.log('Existing users:', allUsers);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

verifyUser();
