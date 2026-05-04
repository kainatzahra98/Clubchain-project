const MembershipPlan = require('../models/MembershipPlan.model');

const getPlans = async (req, res) => {
    try {
        const query = { isActive: true };
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
        const plans = await MembershipPlan.find(query);
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
    updatePlan,
    deletePlan
};
