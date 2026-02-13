const mongoose = require('mongoose');
const MembershipPlan = require('./src/models/MembershipPlan.model');
require('dotenv').config();

const plans = [
    {
        title: "Silver Membership",
        price: "1,000",
        description: "Essential access for regular members.",
        features: ["Club Access (Weekdays)", "Standard Events", "Member Lounge", "> 5 Guests per year"],
        icon: "FaStar",
        isPremium: false,
        isActive: true
    },
    {
        title: "Gold Membership",
        price: "2,500",
        description: "Priority access and premium perks.",
        features: ["Full Club Access", "Priority Event Booking", "VIP Lounge Access", "> 20 Guests per year", "Concierge Service"],
        icon: "FaCrown",
        isPremium: true,
        isActive: true
    },
    {
        title: "Platinum Cartel",
        price: "5,000",
        description: "The ultimate status symbol.",
        features: ["All Gold Features", "Private Office Use", "Helicopter Transfers", "Unlimited Guests", "Dedicated Butler"],
        icon: "FaGem",
        isPremium: false,
        isActive: true
    }
];

const Club = require('./src/models/Club.model');

async function seedPlans() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB Atlas');

        // 1. Fetch all clubs
        const clubs = await Club.find({});
        if (clubs.length === 0) {
            console.log('No clubs found. Please seed clubs first.');
            return;
        }
        console.log(`Found ${clubs.length} clubs to seed plans for.`);

        // 2. Clear existing plans
        await MembershipPlan.deleteMany({});
        console.log('Cleared existing plans');

        // 3. Prepare plans for all clubs
        const allPlans = [];
        clubs.forEach(club => {
            plans.forEach(template => {
                allPlans.push({
                    ...template,
                    clubId: club._id
                });
            });
        });

        // 4. Insert new plans
        await MembershipPlan.insertMany(allPlans);
        console.log(`Successfully seeded ${allPlans.length} plans (${clubs.length} clubs x 3 plans).`);

    } catch (err) {
        console.error('Error seeding plans:', err);
    } finally {
        await mongoose.connection.close();
    }
}

seedPlans();
