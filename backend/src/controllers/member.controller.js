const Membership = require('../models/Membership.model');
const Task = require('../models/Task.model');
const Club = require('../models/Club.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const IntroductionLetter = require('../models/IntroductionLetter.model');
const { processLetterApproval } = require('./introductionLetter.controller');

const MembershipPlan = require('../models/MembershipPlan.model');
const Payment = require('../models/Payment.model');
const Event = require('../models/Event.model');

// @desc    Join a club (create pending membership)
// @route   POST /api/clubs/:id/join
// @access  Private/CLIENT
// @desc    Join a club (create pending membership or process purchase)
// @route   POST /api/clubs/:id/join
// @access  Private/CLIENT
const joinClub = async (req, res) => {
    try {
        console.log('--- JOIN CLUB REQUEST ---');
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        console.log('User:', req.user.id);

        const clubId = req.params.id;

        // Defensive check for user
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated (req.user missing)' });
        }

        const userId = req.user.id;
        const { planId } = req.body;

        let plan = null;
        let expiresAt = null;

        // 1. Validate Plan if provided
        if (planId) {
            plan = await MembershipPlan.findById(planId);
            if (!plan) {
                console.error(`Plan not found: ${planId}`);
                return res.status(404).json({ message: `Plan not found with ID: ${planId}` });
            }
            const durationMonths = plan.durationMonths || 12;
            const date = new Date(); // Start from Now
            date.setMonth(date.getMonth() + durationMonths);
            expiresAt = date;
        }

        // 2. Check for existing membership
        let membership = await Membership.findOne({ userId, clubId });

        if (membership) {
            // Case A: User is paying (planId provided) or just re-joining - Auto-activate
            membership.status = 'active';
            if (expiresAt) membership.expiresAt = expiresAt;
            if (planId) membership.planId = planId;

            await membership.save();

            // Ensure stats and user status are updated
            await User.findByIdAndUpdate(userId, { status: 'ACTIVE' });

            // Increment member count if it wasn't active (simplified)
            await Club.findByIdAndUpdate(clubId, {
                $inc: { 'stats.membersCount': 1 }
            });

            // Notify Admin of Renewal/Purchase
            if (plan) {
                await Task.create({
                    title: 'Membership Renewed',
                    description: `User ${req.user.name} has renewed/updated to ${plan.title}.`,
                    clubId,
                    type: 'NOTIFICATION',
                    relatedId: membership._id,
                    relatedModel: 'Membership'
                });
            }

            return res.status(200).json(membership);
        }

        // 2. Check if Payment is required - redirect to payment flow
        if (plan && parseFloat(plan.price) > 0) {
            // Return error to indicate payment is needed
            return res.status(400).json({ 
                message: 'Payment required. Please use the payment flow to purchase this plan.',
                requiresPayment: true
            });
        }

        // 3. New Membership Creation (For Free Plans or Legacy)
        membership = await Membership.create({
            userId,
            clubId,
            planId,
            status: 'active',
            expiresAt
        });

        // Update Club stats
        await Club.findByIdAndUpdate(clubId, {
            $inc: { 'stats.membersCount': 1 }
        });

        // Update User status
        await User.findByIdAndUpdate(userId, { status: 'ACTIVE' });

        // Create User Notification
        await Notification.create({
            userId,
            type: 'system',
            title: 'Welcome to the Club!',
            message: `You have successfully joined the club.`,
            relatedId: clubId
        });

        // Notify Admin of New Member
        if (plan) {
            await Task.create({
                title: 'New Membership',
                description: `User ${req.user.name} joined with ${plan.title}.`,
                clubId,
                type: 'NOTIFICATION',
                relatedId: membership._id,
                relatedModel: 'Membership'
            });
        }

        return res.status(201).json(membership);

    } catch (error) {
        const fs = require('fs');
        try {
            fs.appendFileSync('join_error.log', `${new Date().toISOString()} - ${error.stack || error.message}\n`);
        } catch (e) { console.error('Log write failed', e); }

        console.error('Join Club Error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
        }
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get tasks for club admin
// @route   GET /api/tasks
// @access  Private/CLUB_ADMIN
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            clubId: req.user.clubId,
            status: 'pending',
            type: { $ne: 'MEMBERSHIP_APPROVAL' } // Hide legacy membership approvals
        })
            .populate({
                path: 'relatedId',
                strictPopulate: false,
                populate: [
                    { path: 'userId', select: 'name email', strictPopulate: false },
                    { path: 'planId', select: 'title', strictPopulate: false },
                    { path: 'memberId', select: 'name email', strictPopulate: false },
                    { path: 'targetClubId', select: 'name', strictPopulate: false }
                ]
            })
            .sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve or Deny membership
// @route   PUT /api/tasks/:id/approve
// @access  Private/CLUB_ADMIN
const handleTask = async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'deny'
        const task = await Task.findById(req.params.id);

        if (!task) return res.status(404).json({ message: 'Task not found' });

        if (task.type === 'INTRO_LETTER_APPROVAL') {
            const letter = await IntroductionLetter.findById(task.relatedId)
                .populate('memberId', 'name email')
                .populate('homeClubId', 'name')
                .populate('targetClubId', 'name');
            if (!letter) return res.status(404).json({ message: 'Introduction Letter not found' });

            const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
            const admin = await User.findById(req.user.id).populate('clubId');
            await processLetterApproval(letter, status, req.body.rejectionReason, admin);

            return res.status(200).json({ message: `Introduction Letter ${action}d successfully` });
        }

        // Default to Membership Approval logic for legacy tasks or specific type
        const membership = await Membership.findById(task.relatedId);
        if (!membership) return res.status(404).json({ message: 'Membership not found' });

        if (action === 'approve') {
            membership.status = 'active';
            task.status = 'completed';

            // Update club stats
            await Club.findByIdAndUpdate(task.clubId, {
                $inc: { 'stats.membersCount': 1 }
            });
            // Activate User Account
            await User.findByIdAndUpdate(membership.userId, { status: 'ACTIVE' });

            // Notify User
            await Notification.create({
                userId: membership.userId,
                type: 'alert',
                title: 'Membership Approved',
                message: 'Your membership request has been approved!',
                relatedId: task.clubId
            });
        } else {
            membership.status = 'rejected';
            task.status = 'cancelled';
            // Notify User
            await Notification.create({
                userId: membership.userId,
                type: 'alert',
                title: 'Membership Update',
                message: 'Your membership request was not approved.',
                relatedId: task.clubId
            });
        }

        await membership.save();
        await task.save();

        res.status(200).json({ message: `Membership ${action}d successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/CLUB_ADMIN
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Authorization check
        if (task.clubId.toString() !== req.user.clubId.toString() && req.user.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        await task.deleteOne();
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all members for a club
// @route   GET /api/members
// @access  Private/CLUB_ADMIN
const getAllMembers = async (req, res) => {
    try {
        const requestedStatus = req.query.status || 'ACTIVE';

        if (req.user.role === 'SYSTEM_ADMIN') {
            const query = requestedStatus === 'ACTIVE'
                ? { status: { $ne: 'DELETED' } }
                : { status: requestedStatus };
            const users = await User.find(query).select('-password').sort({ createdAt: -1 });
            return res.status(200).json(users);
        } else if (req.user.role === 'CLUB_ADMIN') {
            // Club Admin: Fetch memberships in their club
            // status check on user or membership? Usually we want to see members of this club.
            const memberships = await Membership.find({
                clubId: req.user.clubId,
                status: 'active' // Only show active members of the club
            })
                .populate('userId', 'name email status image')
                .populate('planId', 'title')
                .sort({ joinedAt: -1 });

            // Transform into a flat list that the frontend expects
            const members = memberships.map(m => ({
                id: m.userId?._id,
                name: m.userId?.name || 'Unknown',
                email: m.userId?.email,
                status: m.userId?.status || 'ACTIVE',
                tier: m.planId?.title || 'Standard',
                image: m.userId?.image || `https://placehold.co/40x40/333/ccc?text=${m.userId?.name?.charAt(0) || 'U'}`,
                joinedAt: m.joinedAt,
                notes: m.notes || '',
                expiresAt: m.expiresAt
            }));

            return res.status(200).json(members);
        }
        else {
            return res.status(403).json({ message: 'Not authorized for this resource' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's active clubs
// @route   GET /api/members/my-clubs
// @access  Private/CLIENT
const getMyClubs = async (req, res) => {
    try {
        const memberships = await Membership.find({
            userId: req.user.id,
            status: { $in: ['active', 'expired', 'inactive', 'cancelled'] } // Exclude pending and rejected
        })
            .populate('clubId', 'name location image description affiliatedClubs')
            .populate('planId')
            .lean();

        // Fetch clubs where user is a visitor (Approved/Accepted/Activated letters OR Expired letters for feedback)
        const visitingLetters = await IntroductionLetter.find({
            memberId: req.user.id,
            status: { $in: ['APPROVED', 'ACCEPTED', 'EXPIRED'] }
        }).populate('targetClubId', 'name location image description').lean();

        // Extract club objects from memberships
        const joinedClubs = [];
        for (const m of memberships) {
            try {
                if (m.clubId && typeof m.clubId === 'object' && m.clubId.name) {
                    const clubObj = {
                        _id: m._id,
                        clubId: {
                            _id: m.clubId._id.toString(),
                            name: m.clubId.name,
                            location: m.clubId.location || "",
                            image: m.clubId.image || "",
                            affiliatedClubs: m.clubId.affiliatedClubs || []
                        },
                        planId: m.planId,
                        status: m.status,
                        expiresAt: m.expiresAt
                    };
                    joinedClubs.push(clubObj);
                }
            } catch (err) {
                console.error(`[MY-CLUBS] Error mapping membership ${m._id}:`, err.message);
            }
        }

        // Extract club objects from visiting letters
        const visitingClubs = [];
        for (const l of visitingLetters) {
            try {
                if (l.targetClubId && typeof l.targetClubId === 'object' && l.targetClubId.name) {
                    const clubObj = {
                        _id: l._id,
                        clubId: {
                            _id: l.targetClubId._id.toString(),
                            name: l.targetClubId.name,
                            location: l.targetClubId.location || "",
                            image: l.targetClubId.image || ""
                        },
                        planId: { title: 'Visitor (Intro Letter)' },
                        status: 'visitor',
                        expiresAt: l.expiryDate
                    };
                    visitingClubs.push(clubObj);
                }
            } catch (err) {
                console.error(`[MY-CLUBS] Error mapping letter ${l._id}:`, err.message);
            }
        }

        // Combine and unique by ID
        const allClubs = [];
        const seenIds = new Set();
        [...joinedClubs, ...visitingClubs].forEach(club => {
            const clubId = club.clubId._id;
            if (!seenIds.has(clubId)) {
                seenIds.add(clubId);
                allClubs.push(club);
            }
        });

        console.log(`[MY-CLUBS] Returning ${allClubs.length} verified clubs for user ${req.user.id}`);
        res.status(200).json(allClubs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Deactivate/Leave a club
// @route   PUT /api/members/:clubId/deactivate
// @access  Private/CLIENT
const deactivateMembership = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.user.id;

        const membership = await Membership.findOne({ userId, clubId });

        if (!membership) {
            return res.status(404).json({ message: 'Membership not found' });
        }

        if (membership.status === 'inactive' || membership.status === 'cancelled') {
            return res.status(400).json({ message: 'Membership is already inactive' });
        }

        membership.status = 'inactive';
        await membership.save();

        // Optional: Update club stats (decrement members count)
        await Club.findByIdAndUpdate(clubId, { $inc: { 'stats.membersCount': -1 } });

        res.status(200).json({ message: 'Membership deactivated successfully', membership });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ensure Event model is imported (already imported at top)

// @desc    Get member statistics (Joined Clubs, Upcoming Events)
// @route   GET /api/members/stats
// @access  Private/CLIENT
const getMemberStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Active Memberships
        const activeMemberships = await Membership.find({ userId, status: 'active' });
        const joinedClubIds = activeMemberships.map(m => m.clubId.toString());

        // 2. Get Visiting Clubs (Approved letters)
        const visitingLetters = await IntroductionLetter.find({
            memberId: userId,
            status: { $in: ['APPROVED', 'ACCEPTED'] }
        });
        const visitingClubIds = visitingLetters.map(l => l.targetClubId.toString());

        // Combine unique club IDs
        const allRelevantClubIds = [...new Set([...joinedClubIds, ...visitingClubIds])];

        const clubsCount = allRelevantClubIds.length;

        // 3. Get Upcoming Events Count for all relevant clubs
        const upcomingEventsCount = await Event.countDocuments({
            clubId: { $in: allRelevantClubIds },
            date: { $gte: new Date() },
            status: 'published'
        });

        // 4. Points (Mock)
        const points = 0;

        res.status(200).json({
            clubsCount,
            eventsCount: upcomingEventsCount,
            points
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get upcoming events for clubs the user has joined
// @route   GET /api/members/events
// @access  Private/CLIENT
const getMemberEvents = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Active Memberships
        const activeMemberships = await Membership.find({ userId, status: 'active' });
        const joinedClubIds = activeMemberships.map(m => m.clubId.toString());

        // 2. Get Visiting Clubs (Approved letters)
        const visitingLetters = await IntroductionLetter.find({
            memberId: userId,
            status: { $in: ['APPROVED', 'ACCEPTED'] }
        });
        const visitingClubIds = visitingLetters.map(l => l.targetClubId.toString());

        // Combine unique club IDs
        const allRelevantClubIds = [...new Set([...joinedClubIds, ...visitingClubIds])];

        if (allRelevantClubIds.length === 0) {
            return res.status(200).json([]);
        }

        // 3. Find Events for these clubs (Date >= Now)
        const events = await Event.find({
            clubId: { $in: allRelevantClubIds },
            date: { $gte: new Date() },
            status: 'published'
        })
            .sort({ date: 1 })
            .populate('clubId', 'name image');

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single member details
// @route   GET /api/members/:id
// @access  Private/CLUB_ADMIN
const getMemberDetails = async (req, res) => {
    try {
        const userId = req.params.id;
        const clubId = req.user.clubId;

        if (!clubId) {
            return res.status(403).json({ message: 'Must be a club admin' });
        }

        const m = await Membership.findOne({ userId, clubId })
            .populate('userId', 'name email status image phone location')
            .populate('planId', 'title');

        if (!m) {
            // Check if it's just a user without membership (e.g. from Introduction Letter request where member exists but not in this club?)
            // But if we are clicking from Tasks -> Intro Letter Request, the member IS a member of this club.
            // If we are clicking from Tasks -> Visit Confirmation (Incoming), the member is NOT a member of this club.
            // If incoming visitor, we can't find membership in THIS club.
            // We should return what we know from User?
            // But the user said "member details on member page in not sync with the member details on task page".
            // If I am Home Club Admin, I want to see My Member's details.
            // If I am Target Club Admin, I want to see... what? Visitor details?
            // If Target Club, I can't fetch membership.
            // But `MemberDetails` attempts to show "Plan", "Joined", "Notes".
            // For Visitor, "Plan" comes from Letter. "Notes" comes from Letter (Home Club Notes).
            // So `getMemberDetails` for Target Club Viewing Visitor is tricky.
            // However, the "link" in Tasks page is likely on the Member Name.
            // If it's an Intro Letter Request (Outbound), it's MY member. `getMemberDetails` works.
            // If it's a Visit Confirmation (Inbound), it's NOT my member.
            // The sync issue probably refers to MY members. "Member Page" vs "Task Page".
            // So I will implement this for MY members.
            return res.status(404).json({ message: 'Membership not found' });
        }

        const member = {
            id: m.userId?._id,
            name: m.userId?.name || 'Unknown',
            email: m.userId?.email,
            phone: m.userId?.phone,
            location: m.userId?.location,
            status: m.userId?.status || 'ACTIVE', // User status? Or Membership status? MemberDetails shows Membership Status usually.
            // Let's use membership status for consistency
            membershipStatus: m.status,
            tier: m.planId?.title || 'Standard',
            image: m.userId?.image || `https://placehold.co/40x40/333/ccc?text=${m.userId?.name?.charAt(0) || 'U'}`,
            joinedAt: m.joinedAt,
            notes: m.notes || '',
            expiresAt: m.expiresAt
        };

        return res.status(200).json(member);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateMemberNotes = async (req, res) => {
    try {
        const userId = req.params.id;
        const { notes } = req.body;
        const clubId = req.user.clubId;

        if (!clubId) {
            return res.status(403).json({ message: 'Must be a club admin' });
        }

        const membership = await Membership.findOne({ userId, clubId });
        if (!membership) {
            return res.status(404).json({ message: 'Membership not found for this user in your club' });
        }

        membership.notes = notes;
        await membership.save();

        res.status(200).json({ message: 'Notes updated', notes: membership.notes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    joinClub,
    getTasks,
    handleTask,
    getAllMembers,
    getMyClubs,
    deactivateMembership,
    getMemberStats,
    getMemberEvents,
    updateMemberNotes,
    getMemberDetails,
    deleteTask
};
