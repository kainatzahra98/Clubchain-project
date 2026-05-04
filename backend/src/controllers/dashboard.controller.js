const Club = require('../models/Club.model');
const User = require('../models/User.model');
const Feedback = require('../models/Feedback.model');
const Membership = require('../models/Membership.model');
const IntroductionLetter = require('../models/IntroductionLetter.model');
const Event = require('../models/Event.model');
const Payment = require('../models/Payment.model');

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

            // Calculate monthly revenue from successful payments
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            
            const monthlyPayments = await Payment.find({
                status: 'succeeded',
                createdAt: { $gte: startOfMonth, $lt: endOfMonth }
            });
            
            stats.monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0);
            stats.totalRevenue = await Payment.aggregate([
                { $match: { status: 'succeeded' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]).then(result => result[0]?.total || 0);

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
            const club = await Club.findById(clubId);
            
            // Calculate recent feedback (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const [
                totalMembers,
                newMembersThisWeek,
                pendingMemberships,
                pendingHomeLetters,
                pendingTargetLetters,
                clubFeedback,
                recentFeedbackCount
            ] = await Promise.all([
                Membership.countDocuments({ clubId, status: 'active' }),
                Membership.countDocuments({ 
                    clubId, 
                    status: 'active',
                    createdAt: { $gte: sevenDaysAgo }
                }),
                Membership.countDocuments({ clubId, status: 'pending' }),
                IntroductionLetter.countDocuments({ homeClubId: clubId, status: 'PENDING' }),
                IntroductionLetter.countDocuments({ targetClubId: clubId, status: 'APPROVED' }),
                Feedback.countDocuments({ clubId }),
                Feedback.countDocuments({ 
                    clubId, 
                    createdAt: { $gte: sevenDaysAgo } 
                })
            ]);

            stats.totalMembers = totalMembers;
            stats.newMembersThisWeek = newMembersThisWeek;
            stats.pendingTasks = pendingMemberships + pendingHomeLetters + pendingTargetLetters;
            stats.clubFeedback = clubFeedback;
            stats.recentFeedbackCount = recentFeedbackCount;
            stats.totalRevenue = club?.stats?.totalRevenue || 0;
            stats.averageRating = club?.stats?.rating || 0;
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

            // Get clubs where the user is a member (Active)
            const membershipClubIds = activeMemberships
                .filter(m => m.status === 'active' && m.clubId)
                .map(m => m.clubId._id.toString());

            // Get clubs the user is visiting (Intro Letter Approved or Accepted)
            const visitingLetters = await IntroductionLetter.find({
                memberId: req.user.id,
                status: { $in: ['APPROVED', 'ACCEPTED'] }
            }).populate('targetClubId', 'name location');

            stats.visitingClubs = visitingLetters
                .filter(l => l.targetClubId)
                .map(l => ({
                    clubId: l.targetClubId._id,
                    clubName: l.targetClubId.name,
                    clubLocation: l.targetClubId.location,
                    status: 'visitor'
                }));

            const visitingClubIds = visitingLetters
                .filter(l => l.targetClubId)
                .map(l => l.targetClubId._id.toString());

            // (REMOVED) Guest clubs are no longer shown in the dashboard switcher as per user request
            // Only joined and actively visiting clubs should be available.


            // Combine all unique club IDs for event visibility (STRICTLY joined and visited clubs only)
            const strictEventClubIds = [...new Set([...membershipClubIds, ...visitingClubIds])];

            let eventQuery = { status: 'published', date: { $gte: new Date() } };
            if (strictEventClubIds.length > 0) {
                eventQuery.clubId = { $in: strictEventClubIds };
            } else {
                // User has explicitly requested that events only show for clubs they joined/visited
                eventQuery.clubId = { $in: [] };
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
