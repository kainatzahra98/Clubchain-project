const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User.model');
const Club = require('../models/Club.model');
const Feedback = require('../models/Feedback.model');
const Membership = require('../models/Membership.model');
const Task = require('../models/Task.model');
const Event = require('../models/Event.model');
const MembershipPlan = require('../models/MembershipPlan.model');
const IntroductionLetter = require('../models/IntroductionLetter.model');
const Notification = require('../models/Notification.model');
const Payment = require('../models/Payment.model');
const Settings = require('../models/Settings.model');

const fs = require('fs');
const path = require('path');

// Try to find .env in current or parent directory
const envPath = fs.existsSync('./.env') ? './.env' : '../.env';
dotenv.config({ path: envPath });

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding...');

        // Note: Not clearing existing data to preserve user records
        // If you need to reset, uncomment the lines below:
        // await User.deleteMany();
        // await Club.deleteMany();
        // await Feedback.deleteMany();
        // etc.

        console.log('Seeding data (preserving existing records)...');

        // 1. Create Clubs
        const clubs = await Club.insertMany([
            { name: 'Elite Fitness Club', description: 'Premium fitness and wellness', category: 'Health', location: 'Downtown', status: 'pending' },
            { name: 'The coding hub', description: 'Tech and innovation community', category: 'Tech', location: 'Tech Park', status: 'pending' },
            { name: 'Royal Arts Club', description: 'Classical music and arts gallery', category: 'Arts', location: 'Cultural District', status: 'active' }
        ]);

        // 2. Create Users
        const systemAdmin = await User.create({
            name: 'System Admin',
            email: 'admin@clubz.com',
            password: 'password123',
            role: 'SYSTEM_ADMIN'
        });

        const clubAdmins = await User.create([
            { name: 'John Fitness', email: 'john@fitness.com', password: 'password123', role: 'CLUB_ADMIN', clubId: clubs[0]._id },
            { name: 'Alice Code', email: 'alice@code.com', password: 'password123', role: 'CLUB_ADMIN', clubId: clubs[1]._id },
            { name: 'Robert Art', email: 'robert@art.com', password: 'password123', role: 'CLUB_ADMIN', clubId: clubs[2]._id }
        ]);

        const clients = await User.create([
            { name: 'Michael Smith', email: 'michael@gmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'Sarah Jones', email: 'sarah@yahoo.com', password: 'password123', role: 'CLIENT' },
            { name: 'Emma Wilson', email: 'emma@gmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'David Brown', email: 'david@outlook.com', password: 'password123', role: 'CLIENT' },
            { name: 'James Johnson', email: 'james@hotmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'Jennifer Davis', email: 'jennifer@gmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'Christopher Martinez', email: 'chris@yahoo.com', password: 'password123', role: 'CLIENT' },
            { name: 'Amanda Anderson', email: 'amanda@outlook.com', password: 'password123', role: 'CLIENT' },
            { name: 'Matthew Taylor', email: 'matthew@gmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'Jessica Thomas', email: 'jessica@hotmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'Daniel Jackson', email: 'daniel@gmail.com', password: 'password123', role: 'CLIENT' },
            { name: 'Elizabeth White', email: 'elizabeth@yahoo.com', password: 'password123', role: 'CLIENT' }
        ]);

        // 3. Create Memberships
        const memberships = await Membership.insertMany([
            { userId: clients[0]._id, clubId: clubs[0]._id, status: 'active' },
            { userId: clients[1]._id, clubId: clubs[0]._id, status: 'pending' },
            { userId: clients[2]._id, clubId: clubs[1]._id, status: 'active' },
            { userId: clients[3]._id, clubId: clubs[1]._id, status: 'pending' },
            { userId: clients[4]._id, clubId: clubs[0]._id, status: 'active' },
            { userId: clients[5]._id, clubId: clubs[2]._id, status: 'active' },
            { userId: clients[6]._id, clubId: clubs[0]._id, status: 'active' },
            { userId: clients[7]._id, clubId: clubs[1]._id, status: 'pending' },
            { userId: clients[8]._id, clubId: clubs[2]._id, status: 'active' },
            { userId: clients[9]._id, clubId: clubs[0]._id, status: 'pending' },
            { userId: clients[10]._id, clubId: clubs[1]._id, status: 'active' },
            { userId: clients[11]._id, clubId: clubs[2]._id, status: 'pending' }
        ]);

        // 4. Update Club Member Counts
        await Club.findByIdAndUpdate(clubs[0]._id, { 'stats.membersCount': 4 });
        await Club.findByIdAndUpdate(clubs[1]._id, { 'stats.membersCount': 3 });
        await Club.findByIdAndUpdate(clubs[2]._id, { 'stats.membersCount': 2 });

        // 5. Create Tasks
        await Task.insertMany([
            { title: 'New Membership Request', description: 'Sarah Jones wants to join Elite Fitness Club', clubId: clubs[0]._id, relatedId: memberships[1]._id },
            { title: 'New Membership Request', description: 'Michael Smith wants to join The coding hub', clubId: clubs[1]._id, relatedId: memberships[3]._id }
        ]);

        // 6. Create Feedback
        await Feedback.insertMany([
            { userId: clients[0]._id, clubId: clubs[0]._id, rating: 5, message: 'Excellent facilities!', sentiment: 'positive', sentimentScore: 0.98, type: 'general', status: 'resolved' },
            { userId: clients[2]._id, clubId: clubs[1]._id, rating: 2, message: 'The equipment is quite old and slow', sentiment: 'negative', sentimentScore: 0.85, type: 'complaint', status: 'pending' },
            { userId: clients[1]._id, clubId: clubs[0]._id, rating: 4, message: 'Love the new app design!', sentiment: 'positive', sentimentScore: 0.90, type: 'feature', status: 'pending' },
            { userId: clients[3]._id, clubId: clubs[0]._id, rating: 1, message: 'Login is broken on Android', sentiment: 'negative', sentimentScore: 0.15, type: 'bug', status: 'pending' }
        ]);

        // 7. Create Events
        await Event.insertMany([
            {
                title: 'Winter Gala 2025',
                description: 'A luxurious and elegant winter gala in the grand ballroom.',
                date: new Date('2025-12-28'),
                time: '8:00 PM',
                location: 'Grand Ballroom',
                image: 'https://images.unsplash.com/photo-1514525253361-bee8d4ca72a7?q=80&w=1000&auto=format&fit=crop',
                status: 'published',
                createdBy: systemAdmin._id,
                attendeesCount: 120
            },
            {
                title: "Founder's Private Dinner",
                description: 'An exclusive dinner for club founders.',
                date: new Date('2026-01-05'),
                time: '7:30 PM',
                location: 'The Penthouse',
                image: 'https://images.unsplash.com/photo-1530101974391-017e8870ed96?q=80&w=1000&auto=format&fit=crop',
                status: 'published',
                createdBy: systemAdmin._id,
                attendeesCount: 45
            },
            {
                title: 'Networking Night',
                description: 'Connect with fellow professionals in our modern lounge.',
                date: new Date('2026-01-15'),
                time: '6:00 PM',
                location: 'Club Lounge',
                image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop',
                status: 'published',
                createdBy: systemAdmin._id,
                attendeesCount: 75
            }
        ]);

        // 8. Create Membership Plans
        const membershipPlans = await MembershipPlan.insertMany([
            {
                clubId: clubs[0]._id,
                title: 'Silver Membership',
                price: '$150',
                durationMonths: 12,
                description: 'Basic access to fitness facilities and group classes',
                features: [
                    'Access to gym facilities',
                    'Group fitness classes',
                    'Locker room access',
                    'Monthly fitness assessment'
                ],
                icon: 'FaStar',
                isPremium: false
            },
            {
                clubId: clubs[0]._id,
                title: 'Gold Membership',
                price: '$300',
                durationMonths: 12,
                description: 'Enhanced access with personal training sessions',
                features: [
                    'All Silver benefits',
                    '4 personal training sessions per month',
                    'Access to premium equipment',
                    'Priority booking for classes',
                    'Free guest passes (2 per month)'
                ],
                icon: 'FaCrown',
                isPremium: true
            },
            {
                clubId: clubs[0]._id,
                title: 'Platinum Membership',
                price: '$500',
                durationMonths: 12,
                description: 'Ultimate access with exclusive perks and VIP treatment',
                features: [
                    'All Gold benefits',
                    'Unlimited personal training',
                    'VIP locker room access',
                    'Spa and sauna access',
                    'Nutrition consulting',
                    'Priority event access',
                    'Unlimited guest passes'
                ],
                icon: 'FaGem',
                isPremium: true
            }
        ]);

        // 9. Create Introduction Letters
        await IntroductionLetter.insertMany([
            {
                memberId: clients[0]._id,
                homeClubId: clubs[0]._id,
                targetClubId: clubs[1]._id,
                status: 'PENDING',
                visitDate: new Date('2026-02-15'),
                purpose: 'Networking and technology exchange',
                duration: 1
            },
            {
                memberId: clients[1]._id,
                homeClubId: clubs[0]._id,
                targetClubId: clubs[2]._id,
                status: 'APPROVED',
                visitDate: new Date('2026-01-20'),
                purpose: 'Art exhibition visit',
                duration: 2,
                qrToken: 'sample_qr_token_123'
            }
        ]);

        // 10. Create Notifications
        await Notification.insertMany([
            {
                userId: clients[0]._id,
                type: 'success',
                title: 'Welcome to ClubChain!',
                message: 'Your account has been successfully created.',
                isRead: false
            },
            {
                userId: clubAdmins[0]._id,
                type: 'alert',
                title: 'New Membership Request',
                message: 'Sarah Jones has requested to join Elite Fitness Club.',
                isRead: false,
                relatedId: memberships[1]._id
            },
            {
                userId: systemAdmin._id,
                type: 'info',
                title: 'New Club Registration',
                message: 'A new club has registered and awaits approval.',
                isRead: false
            }
        ]);

        // 11. Create Payments
        await Payment.insertMany([
            {
                userId: clients[0]._id,
                clubId: clubs[0]._id,
                planId: membershipPlans[0]._id,
                amount: 150,
                currency: 'usd',
                status: 'succeeded',
                stripeSessionId: 'sess_test_123',
                stripePaymentIntentId: 'pi_test_123'
            },
            {
                userId: clients[2]._id,
                clubId: clubs[1]._id,
                planId: membershipPlans[1]._id,
                amount: 300,
                currency: 'usd',
                status: 'pending',
                stripeSessionId: 'sess_test_456'
            }
        ]);

        // 12. Create Settings
        await Settings.create({
            platformName: 'ClubChain Premium',
            supportEmail: 'support@clubchain.com',
            defaultCurrency: 'USD',
            maintenanceMode: false,
            forcePasswordReset: false,
            sessionTimeout: 30,
            twoFactorEnforced: true,
            updatedBy: systemAdmin._id
        });

        console.log('Database Seeded Successfully! 🌱');
        process.exit();
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
