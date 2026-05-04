const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        const User = require('../models/User.model');

        const superAdminEmail = 'admin@clubz.com';
        const superAdminPassword = 'password123';

        let user = await User.findOne({ email: superAdminEmail });

        if (user) {
            console.log('SuperAdmin already exists. Updating password and permissions...');
            user.password = superAdminPassword;
            user.role = 'SYSTEM_ADMIN';
            user.permissions = ['ALL'];
            await user.save();
        } else {
            console.log('Creating SuperAdmin...');
            await User.create({
                name: 'Super Admin',
                email: superAdminEmail,
                password: superAdminPassword,
                role: 'SYSTEM_ADMIN',
                permissions: ['ALL'],
                isVerified: true,
                status: 'ACTIVE'
            });
        }

        console.log('SuperAdmin seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding SuperAdmin:', err);
        process.exit(1);
    }
};

seedSuperAdmin();
