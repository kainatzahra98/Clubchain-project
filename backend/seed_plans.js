const { MongoClient } = require('mongodb');
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

async function seedPlans() {
    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');

        const db = client.db('clubchainapp');
        const collection = db.collection('membershipplans');

        // Clear existing plans
        await collection.deleteMany({});
        console.log('Cleared existing plans');

        // Insert new plans
        await collection.insertMany(plans);
        console.log('Seeded 3 membership plans successfully');

    } catch (err) {
        console.error('Error seeding plans:', err);
    } finally {
        await client.close();
    }
}

seedPlans();
