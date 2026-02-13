const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: './.env' });

const User = require('./src/models/User.model');
const Club = require('./src/models/Club.model');
const Membership = require('./src/models/Membership.model');
const MembershipPlan = require('./src/models/MembershipPlan.model');
const Task = require('./src/models/Task.model');
const Event = require('./src/models/Event.model');

const seedData = async () => {
    try {
        console.log('🚀 Connecting to MongoDB via Mongoose...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected successfully!');

        // Clear existing data
        console.log('🧹 Clearing collections...');
        await Promise.all([
            User.deleteMany({}),
            Club.deleteMany({}),
            Membership.deleteMany({}),
            MembershipPlan.deleteMany({}),
            Task.deleteMany({}),
            Event.deleteMany({})
        ]);

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create Clubs (Active by default for seeding)
        console.log('🌱 Seeding Clubs...');
        const clubsData = [
            { name: 'Elite Fitness Club', description: 'Premium fitness and wellness', category: 'Health', location: 'Downtown', stats: { membersCount: 0 }, status: 'active' },
            { name: 'The coding hub', description: 'Tech and innovation community', category: 'Tech', location: 'Tech Park', stats: { membersCount: 0 }, status: 'active' },
            { name: 'Royal Arts Club', description: 'Classical music and arts gallery', category: 'Arts', location: 'Cultural District', stats: { membersCount: 0 }, status: 'active' }
        ];
        const clubs = await Club.insertMany(clubsData);

        // Set affiliations
        clubs[0].affiliatedClubs = [clubs[1]._id, clubs[2]._id];
        clubs[1].affiliatedClubs = [clubs[0]._id];
        clubs[2].affiliatedClubs = [clubs[0]._id];
        await Promise.all(clubs.map(c => c.save()));
        console.log('🔗 Established Club Affiliations');

        // 2. Create Membership Plans
        console.log('🌱 Seeding Membership Plans...');
        const planTemplates = [
            { title: "Silver Membership", price: "1,500", description: "Essential access.", features: ["Access"], icon: "FaStar" },
            { title: "Gold Membership", price: "3,500", description: "Priority access.", features: ["VIP"], icon: "FaCrown" }
        ];

        const allPlans = [];
        clubs.forEach(club => {
            planTemplates.forEach(template => {
                allPlans.push({ ...template, clubId: club._id });
            });
        });
        await MembershipPlan.insertMany(allPlans);

        // 3. Create Users
        console.log('🌱 Seeding Users...');
        const usersData = [
            { name: 'System Admin', email: 'admin@clubz.com', password: hashedPassword, role: 'SYSTEM_ADMIN', isVerified: true },
            { name: 'John Fitness', email: 'john@fitness.com', password: hashedPassword, role: 'CLUB_ADMIN', clubId: clubs[0]._id, isVerified: true },
            { name: 'Alice Code', email: 'alice@code.com', password: hashedPassword, role: 'CLUB_ADMIN', clubId: clubs[1]._id, isVerified: true },
            { name: 'Michael Smith', email: 'michael@gmail.com', password: hashedPassword, role: 'CLIENT', clubId: clubs[0]._id, isVerified: true },
            { name: 'Sarah Jones', email: 'sarah@yahoo.com', password: hashedPassword, role: 'CLIENT', clubId: clubs[0]._id, isVerified: true }
        ];
        const users = await User.insertMany(usersData);

        // 4. Create Memberships
        console.log('🌱 Seeding Memberships...');
        await Membership.create([
            { userId: users[3]._id, clubId: clubs[0]._id, status: 'active' },
            { userId: users[4]._id, clubId: clubs[0]._id, status: 'pending' }
        ]);

        console.log('\n✨ Database Seeded Successfully! 🌱');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
