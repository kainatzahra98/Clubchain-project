const mongoose = require('mongoose');

const URI = 'mongodb+srv://clubchainapp:clubchain123@clubchain.4ok5mfx.mongodb.net/clubchainapp?appName=Clubchain';

const EventSchema = new mongoose.Schema({
    title: String,
    description: String,
    date: Date,
    time: String,
    location: String,
    image: String,
    status: String,
    createdBy: mongoose.Schema.Types.ObjectId,
    attendeesCount: { type: Number, default: 0 }
});

const UserSchema = new mongoose.Schema({
    role: String
});

const Event = mongoose.model('Event', EventSchema);
const User = mongoose.model('User', UserSchema);

async function seed() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'SYSTEM_ADMIN' });
        if (!admin) {
            console.log('No admin found, aborting');
            process.exit(1);
        }

        const events = [
            {
                title: 'Winter Gala 2025',
                description: 'A luxurious and elegant winter gala in the grand ballroom.',
                date: new Date('2025-12-28'),
                time: '8:00 PM',
                location: 'Grand Ballroom',
                image: 'https://images.unsplash.com/photo-1514525253361-bee8d4ca72a7?q=80&w=1000&auto=format&fit=crop',
                status: 'published',
                createdBy: admin._id,
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
                createdBy: admin._id,
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
                createdBy: admin._id,
                attendeesCount: 75
            }
        ];

        await Event.deleteMany({});
        await Event.insertMany(events);
        console.log('Seeded events successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding:', err);
        process.exit(1);
    }
}

seed();
