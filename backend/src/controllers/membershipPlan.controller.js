const MembershipPlan = require('../models/MembershipPlan.model');

const getPlans = async (req, res) => {
    try {
        let query = {};
        
        // Regular clients only see active plans
        if (req.user && req.user.role === 'CLIENT') {
            query.isActive = { $ne: false };
        }

        if (req.query.clubId) {
            if (req.query.strict === 'true') {
                query.clubId = req.query.clubId;
            } else {
                query.$or = [
                    { clubId: req.query.clubId },
                    { clubId: { $exists: false } },
                    { clubId: null }
                ];
            }
        }
        const plans = await MembershipPlan.find(query).populate('clubId', 'name');
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a membership plan
// @route   POST /api/membership-plans
// @access  Private/SYSTEM_ADMIN or CLUB_ADMIN
const createPlan = async (req, res) => {
    try {
        const planData = {
            ...req.body,
            clubId: req.user.clubId || req.body.clubId // Prioritize logged-in admin's club
        };

        if (!planData.clubId && req.user.role !== 'SYSTEM_ADMIN') {
            return res.status(400).json({ message: 'Club ID is required' });
        }

        const plan = await MembershipPlan.create(planData);
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create membership plans for multiple clubs (or all active clubs)
// @route   POST /api/membership-plans/bulk
// @access  Private/SYSTEM_ADMIN
const createBulkPlans = async (req, res) => {
    try {
        const Club = require('../models/Club.model');
        const { clubIds, allClubs, ...planData } = req.body;

        let targetClubIds = clubIds || [];

        // If allClubs flag is set, fetch all active club IDs
        if (allClubs) {
            const activeClubs = await Club.find({ status: 'active' }).select('_id');
            targetClubIds = activeClubs.map(c => c._id);
        }

        if (!targetClubIds || targetClubIds.length === 0) {
            return res.status(400).json({ message: 'No clubs selected for plan creation' });
        }

        // Create one plan per club
        const createdPlans = await Promise.all(
            targetClubIds.map(clubId =>
                MembershipPlan.create({ ...planData, clubId })
            )
        );

        // Populate clubId name for response
        const populated = await MembershipPlan.find({
            _id: { $in: createdPlans.map(p => p._id) }
        }).populate('clubId', 'name');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a membership plan
// @route   PUT /api/membership-plans/:id
// @access  Private/SYSTEM_ADMIN
const updatePlan = async (req, res) => {
    try {
        let plan = await MembershipPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Authorization check
        if (req.user.role === 'CLUB_ADMIN' && plan.clubId.toString() !== req.user.clubId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this plan' });
        }

        plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a membership plan (soft delete)
// @route   DELETE /api/membership-plans/:id
// @access  Private/SYSTEM_ADMIN
const deletePlan = async (req, res) => {
    try {
        let plan = await MembershipPlan.findById(req.params.id);

        if (!plan) {
            return res.status(404).json({ message: 'Plan not found' });
        }

        // Authorization check
        if (req.user.role === 'CLUB_ADMIN' && plan.clubId.toString() !== req.user.clubId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this plan' });
        }

        plan = await MembershipPlan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

        res.status(200).json({ message: 'Plan deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPlans,
    createPlan,
    createBulkPlans,
    updatePlan,
    deletePlan
};
