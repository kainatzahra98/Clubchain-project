const Club = require('../models/Club.model');
const User = require('../models/User.model');
const Feedback = require('../models/Feedback.model');
const Membership = require('../models/Membership.model');
const IntroductionLetter = require('../models/IntroductionLetter.model');
const Event = require('../models/Event.model');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        let stats = {};

        if (req.user.role === 'SYSTEM_ADMIN') {
            stats.totalClubs = await Club.countDocuments();
            stats.activeClubs = await Club.countDocuments({ status: 'active' });
            stats.totalUsers = await User.countDocuments({ status: { $ne: 'DELETED' } });
            stats.totalMembers = stats.totalUsers;
            stats.totalFeedback = await Feedback.countDocuments();
            stats.negativeFeedback = await Feedback.countDocuments({ sentiment: 'negative', status: 'pending' });

            // Fetch Recent Activities
            const [recentLetters, recentUsers, recentClubs] = await Promise.all([
                IntroductionLetter.find()
                    .populate('memberId', 'name')
                    .populate('targetClubId', 'name')
                    .sort({ createdAt: -1 })
                    .limit(5),
                User.find({ role: 'CLIENT' })
                    .sort({ createdAt: -1 })
                    .limit(5),
                Club.find({ status: { $in: ['inactive', 'pending'] } })
                    .sort({ createdAt: -1 })
                    .limit(5)
            ]);

            const activities = [
                ...recentLetters.map(l => ({
                    id: l._id,
                    user: l.memberId?.name || 'Unknown Member',
                    action: `Requested Intro to ${l.targetClubId?.name || 'a club'}`,
                    time: l.createdAt,
                    status: l.status,
                    type: 'letter'
                })),
                ...recentUsers.map(u => ({
                    id: u._id,
                    user: u.name,
                    action: 'Joined the platform',
                    time: u.createdAt,
                    status: 'Active',
                    type: 'user'
                })),
                ...recentClubs.map(c => ({
                    id: c._id,
                    user: c.name,
                    action: 'Club registration pending',
                    time: c.createdAt,
                    status: c.status === 'inactive' ? 'Pending' : 'Review',
                    type: 'club'
                }))
            ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

            stats.recentActivities = activities;
        } else if (req.user.role === 'CLUB_ADMIN') {
            const clubId = req.user.clubId;
            stats.totalMembers = await Membership.countDocuments({ clubId, status: 'active' });
            stats.pendingRequests = await Membership.countDocuments({ clubId, status: 'pending' });
            stats.clubFeedback = await Feedback.countDocuments({ clubId });
        } else {
            // Client stats
            const activeMemberships = await Membership.find({ userId: req.user.id })
                .populate('clubId', 'name location')
                .populate('planId', 'title durationMonths features');

            stats.myMemberships = activeMemberships
                .filter(m => m.clubId) // Filter out memberships with deleted clubs
                .map(m => ({
                    clubName: m.clubId.name,
                    clubLocation: m.clubId.location,
                    planName: m.planId?.title || 'Standard',
                    planFeatures: m.planId?.features || [],
                    status: m.status,
                    expiresAt: m.expiresAt,
                    clubId: m.clubId._id
                }));

            // Get list of club IDs where user is a member (active or pending? usually active for events)
            // User request: "events which are being held on the clubs in which that user registered"
            // "Registered" implies active membership.
            const myClubIds = activeMemberships
                .filter(m => m.status === 'active' && m.clubId) // Ensure clubId is not null
                .map(m => m.clubId._id);

            // Fetch published events ONLY for my clubs
            // If no clubs, maybe we return empty or random? Assuming empty for "my events".
            // But for discovery, we might want all. The prompt says "show the events... on the clubs... registered".
            // So strict filtering seems requested.

            let eventQuery = { status: 'published', date: { $gte: new Date() } };
            if (myClubIds.length > 0) {
                eventQuery.clubId = { $in: myClubIds };
            } else {
                // If not a member of any club, show no events (or maybe global events if we had them)
                // For now, strict filter means no events if no clubs. 
                // However, to avoid empty dashboard look, maybe we skip adding clubId filter if empty?
                // No, "show events... in which user registered" implies specific relevance.
                // I will strictly filter, but if the list is empty, I'll return an empty list so the frontend says "No upcoming events".
                eventQuery.clubId = { $in: [] }; // Force empty if no clubs
            }

            stats.upcomingEvents = await Event.find(eventQuery)
                .sort({ date: 1 })
                .populate('clubId', 'name')
                .limit(10);
        }

        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getStats };
