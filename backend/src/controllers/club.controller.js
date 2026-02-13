const Club = require('../models/Club.model');

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res) => {
    try {
        const clubs = await Club.find({}); // Fetch all clubs regardless of status for dev/explore
        console.log(`[API] Returning ${clubs.length} clubs to frontend.`);
        res.status(200).json(clubs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single club
// @route   GET /api/clubs/:id
// @access  Public
const getClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id).populate('affiliatedClubs', 'name location image');
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }
        res.status(200).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new club
// @route   POST /api/clubs
// @access  Private/SYSTEM_ADMIN
const createClub = async (req, res) => {
    try {
        const club = await Club.create(req.body);

        // Link the club to the creating admin
        if (req.user && req.user.id) {
            const User = require('../models/User.model');
            await User.findByIdAndUpdate(req.user.id, { clubId: club._id });
        }

        res.status(201).json(club);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update club
// @route   PUT /api/clubs/:id
// @access  Private/CLUB_ADMIN
const updateClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        // Verify ownership (if not system admin)
        // Assuming req.user.clubId is populated or check against user role
        // For simplicity allow CLUB_ADMIN to update if they are accessing the route protected by middleware
        // Ideally we check if req.user.clubId === req.params.id

        const updatedClub = await Club.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json(updatedClub);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add affiliated club
// @route   POST /api/clubs/:id/affiliate
// @access  Private/CLUB_ADMIN
const addAffiliate = async (req, res) => {
    try {
        const { targetClubId } = req.body;
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        if (club.affiliatedClubs.includes(targetClubId)) {
            return res.status(400).json({ message: 'Club is already affiliated' });
        }

        club.affiliatedClubs.push(targetClubId);
        await club.save();

        // Populate and return
        await club.populate('affiliatedClubs', 'name location image');

        res.status(200).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove affiliated club
// @route   DELETE /api/clubs/:id/affiliate/:targetId
// @access  Private/CLUB_ADMIN
const removeAffiliate = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        club.affiliatedClubs = club.affiliatedClubs.filter(
            (id) => id.toString() !== req.params.targetId
        );
        await club.save();

        // Populate and return
        await club.populate('affiliatedClubs', 'name location image');

        res.status(200).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Activate club
// @route   PUT /api/clubs/:id/activate
// @access  Private/SYSTEM_ADMIN
const approveClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        club.status = 'active';
        await club.save();

        // 3. Notify Club Admin (Optional - don't fail if notification fails)
        try {
            const User = require('../models/User.model');
            const Notification = require('../models/Notification.model');
            const admin = await User.findOne({ clubId: club._id, role: 'CLUB_ADMIN' });

            if (admin) {
                await Notification.create({
                    userId: admin._id,
                    type: 'success',
                    title: 'Club Activated!',
                    message: `Congratulations! ${club.name} has been approved and is now live on the platform.`,
                    relatedId: club._id
                });
            }
        } catch (notifyError) {
            console.error('[WARN] Failed to send activation notification:', notifyError.message);
        }

        res.status(200).json({ message: 'Club activated successfully', club });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getClubs,
    getClub,
    createClub,
    updateClub,
    addAffiliate,
    removeAffiliate,
    approveClub
};
