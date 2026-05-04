const Event = require('../models/Event.model');
const Club = require('../models/Club.model');
const Membership = require('../models/Membership.model');
const IntroductionLetter = require('../models/IntroductionLetter.model');

// @desc    Get all events
// @route   GET /api/events
// @access  Private/ADMIN
const getEvents = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'CLUB_ADMIN') {
            query.clubId = req.user.clubId;
        } else if (req.query.clubId) {
            query.clubId = req.query.clubId;
        }

        const events = await Event.find(query)
            .populate('clubId', 'name')
            .populate('createdBy', 'name')
            .sort({ date: 1 });

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get events for clubs the member has joined or is visiting
// @route   GET /api/events/my-club-events
// @access  Private/CLIENT
const getMemberEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get clubs where the user is a member (Active)
        const memberships = await Membership.find({ userId, status: 'active' });
        const joinedClubIds = memberships.map(m => m.clubId.toString());

        // 2. Get clubs the user is visiting (Intro Letter Approved or Accepted)
        const visitingLetters = await IntroductionLetter.find({
            memberId: userId,
            status: { $in: ['APPROVED', 'ACCEPTED'] }
        });
        const visitingClubIds = visitingLetters.map(l => l.targetClubId.toString());

        // Combine all unique club IDs
        const allRelevantClubIds = [...new Set([...joinedClubIds, ...visitingClubIds])];

        if (allRelevantClubIds.length === 0) {
            return res.json([]);
        }

        // Fetch published events for these clubs
        const events = await Event.find({
            clubId: { $in: allRelevantClubIds },
            status: 'published'
        })
            .populate('clubId', 'name image location')
            .sort({ date: 1 });

        res.json(events);
    } catch (error) {
        console.error('[ERROR] getMemberEvents:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Create an event
// @route   POST /api/events
// @access  Private/ADMIN
const createEvent = async (req, res) => {
    try {
        const { title, description, date, time, location, clubId, status } = req.body;

        // If clubId is not provided and user is CLUB_ADMIN, use their clubId
        const activeClubId = clubId || (req.user.role === 'CLUB_ADMIN' ? req.user.clubId : null);

        if (!activeClubId) {
            return res.status(400).json({ message: 'Please provide a clubId' });
        }

        const event = await Event.create({
            title,
            description,
            date,
            time,
            location,
            clubId: activeClubId,
            status,
            image: req.file ? `/uploads/events/${req.file.filename}` : undefined,
            createdBy: req.user.id
        });

        // Populate the event with club and user data
        await event.populate('clubId', 'name');
        await event.populate('createdBy', 'name');

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/ADMIN
const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Make sure user is event owner or SYSTEM_ADMIN
        if (req.user.role !== 'SYSTEM_ADMIN' && event.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this event' });
        }

        const updates = { ...req.body };
        if (req.file) {
            updates.image = `/uploads/events/${req.file.filename}`;
        }

        event = await Event.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        // Populate the event with club and user data
        await event.populate('clubId', 'name');
        await event.populate('createdBy', 'name');

        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/ADMIN
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Make sure user is event owner or SYSTEM_ADMIN
        if (req.user.role !== 'SYSTEM_ADMIN' && event.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();

        res.status(200).json({ message: 'Event removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const seedEvents = async (req, res) => {
    try {
        const events = [
            {
                title: 'Winter Gala 2025',
                description: 'A luxurious and elegant winter gala in the grand ballroom.',
                date: new Date('2025-12-28'),
                time: '8:00 PM',
                location: 'Grand Ballroom',
                image: '/uploads/events/event1.png',
                status: 'published',
                attendeesCount: 120,
                createdBy: '65840d8f1e8f230012345678'
            },
            {
                title: "Founder's Private Dinner",
                description: 'An exclusive dinner for club founders.',
                date: new Date('2026-01-05'),
                time: '7:30 PM',
                location: 'The Penthouse',
                image: '/uploads/events/event2.png',
                status: 'published',
                attendeesCount: 45,
                createdBy: '65840d8f1e8f230012345678'
            },
            {
                title: 'Networking Night',
                description: 'Connect with fellow professionals in our modern lounge.',
                date: new Date('2026-01-15'),
                time: '6:00 PM',
                location: 'Club Lounge',
                image: '/uploads/events/event3.png',
                status: 'published',
                attendeesCount: 75,
                createdBy: '65840d8f1e8f230012345678'
            },
            {
                title: 'Summer Pool Party',
                description: 'Dive into summer with music, drinks, and fun by the pool.',
                date: new Date('2026-06-20'),
                time: '2:00 PM',
                location: 'Rooftop Pool',
                image: '/uploads/events/event4.png',
                status: 'published',
                attendeesCount: 0,
                createdBy: '65840d8f1e8f230012345678'
            },
            {
                title: 'Charity Marathon',
                description: 'Run for a cause! Join us for our annual charity fundrun.',
                date: new Date('2026-04-10'),
                time: '7:00 AM',
                location: 'City Park',
                image: '/uploads/events/event5.png',
                status: 'published',
                attendeesCount: 0,
                createdBy: '65840d8f1e8f230012345678'
            }
        ];

        await Event.deleteMany({});
        await Event.insertMany(events);
        res.status(200).json({ message: 'Seeded successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEvents,
    getMemberEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    seedEvents
};
