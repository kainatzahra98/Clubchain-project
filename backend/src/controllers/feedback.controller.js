const Feedback = require('../models/Feedback.model');
const { analyzeSentiment } = require('../services/sentiment.service');

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Private/CLIENT
const submitFeedback = async (req, res) => {
    try {
        const { clubId, rating, message, type } = req.body;

        console.log('--- Feedback Submission Backend ---');
        console.log('User:', req.user.id);
        console.log('Club ID:', clubId);
        console.log('Type:', type);
        console.log('Message:', message);

        // Call AI sentiment service
        const aiResult = await analyzeSentiment(message);

        // Binary Sentiment Logic: No 'neutral' allowed.
        let sentiment = aiResult.sentiment;

        // Force binary decision if AI says neutral
        if (sentiment === 'neutral' || !sentiment) {
            // Threshold-based assignment: 3 stars and above is positive
            sentiment = rating >= 3 ? 'positive' : 'negative';
        }

        let assignedType = type;
        if (sentiment === 'positive') {
            assignedType = 'praise';
        } else {
            // All non-positive feedback (negative) defaults to complaint if general
            sentiment = 'negative'; // Ensure it's strictly 'negative'
            if (type === 'general') {
                assignedType = 'complaint';
            }
        }

        const feedback = await Feedback.create({
            userId: req.user.id,
            clubId,
            rating,
            message,
            type: assignedType,
            sentiment: sentiment,
            sentimentScore: aiResult.confidence,
            status: 'pending'
        });

        // Update club rating stats
        try {
            const Club = require('../models/Club.model');
            const allFeedback = await Feedback.find({ clubId, status: { $ne: 'deleted' } });
            const avgRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
            
            await Club.findByIdAndUpdate(clubId, {
                'stats.rating': Math.round(avgRating * 10) / 10
            });
        } catch (updateError) {
            console.error('[WARN] Failed to update club rating:', updateError.message);
        }

        res.status(201).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all feedback (System Admin Only)
// @route   GET /api/feedback
// @access  Private/SYSTEM_ADMIN
const getFeedback = async (req, res) => {
    try {
        let query = {};

        // Role-based Access Control
        if (req.user.role === 'CLUB_ADMIN') {
            // Club Admins can only see feedback for their club
            if (!req.user.clubId) {
                return res.status(400).json({ message: 'Club Admin has no associated club' });
            }
            query.clubId = req.user.clubId;
        } else if (req.user.role !== 'SYSTEM_ADMIN') {
            // If not Club Admin AND not System Admin
            return res.status(403).json({ message: 'Access denied' });
        }

        // Filter out deleted feedback unless specifically requested for Trash Bin
        if (req.query.status === 'deleted') {
            query.status = 'deleted';
        } else {
            query.status = { $ne: 'deleted' };
        }

        const feedback = await Feedback.find(query)
            .populate('userId', 'name email')
            .populate('clubId', 'name')
            .populate('assignedTo', 'name email')
            .sort({ submittedAt: -1 });

        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update feedback status/resolution
// @route   PUT /api/feedback/:id
// @access  Private/ADMIN
const updateFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        if (req.body.assignedTo && (!feedback.assignedTo || req.body.assignedTo !== feedback.assignedTo.toString())) {
            const Task = require('../models/Task.model');
            await Task.create({
                title: `New Feedback Assignment`,
                description: `You have been assigned a new feedback item: "${feedback.message.substring(0, 50)}..."`,
                clubId: feedback.clubId,
                type: 'NOTIFY_ASSIGNEE',
                relatedId: feedback._id,
                assignedTo: req.body.assignedTo
            });
        }

        feedback.status = req.body.status || feedback.status;
        feedback.assignedTo = req.body.assignedTo || feedback.assignedTo;
        feedback.type = req.body.type || feedback.type;
        const updatedFeedback = await feedback.save();

        const populatedFeedback = await Feedback.findById(updatedFeedback._id)
            .populate('userId', 'name email')
            .populate('assignedTo', 'name email');

        res.status(200).json(populatedFeedback);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/ADMIN
const deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        feedback.status = 'deleted';
        await feedback.save();
        res.status(200).json({ message: 'Feedback moved to trash bin' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Notify feedback assignee again
// @route   POST /api/feedback/:id/notify
// @access  Private/ADMIN
const notifyAssignee = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id).populate('assignedTo');

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        if (!feedback.assignedTo) {
            return res.status(400).json({ message: 'No assignee to notify' });
        }

        const Task = require('../models/Task.model');
        await Task.create({
            title: `URGENT: Feedback Follow-up`,
            description: `System Admin is requesting an update on feedback: "${feedback.message.substring(0, 50)}..."`,
            clubId: feedback.clubId,
            type: 'NOTIFY_ASSIGNEE',
            relatedId: feedback._id,
            assignedTo: feedback.assignedTo._id // Note: Task model doesn't have assignedTo yet, let's check
        });

        res.status(200).json({ message: 'Assignee notified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Restore feedback from trash
// @route   PUT /api/feedback/:id/restore
// @access  Private/ADMIN
const restoreFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        feedback.status = 'pending';
        await feedback.save();
        res.status(200).json({ message: 'Feedback restored' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get club rankings by positive feedback
// @route   GET /api/feedback/rankings
// @access  Private/CLIENT
const getClubRankings = async (req, res) => {
    try {
        const rankings = await Feedback.aggregate([
            // Only count non-deleted feedback that belongs to a club
            { $match: { status: { $ne: 'deleted' }, clubId: { $exists: true, $ne: null } } },
            {
                $group: {
                    _id: '$clubId',
                    totalFeedback: { $sum: 1 },
                    positiveCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } },
                    negativeCount: { $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] } },
                    avgRating: { $avg: '$rating' },
                    // Positivity score: positive=1, negative=-1
                    positivityScore: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ['$sentiment', 'positive'] }, then: 1 },
                                    { case: { $eq: ['$sentiment', 'negative'] }, then: -1 }
                                ],
                                default: 0
                            }
                        }
                    }
                }
            },
            { $sort: { positivityScore: -1, avgRating: -1 } },
            {
                $lookup: {
                    from: 'clubs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'club'
                }
            },
            { $unwind: '$club' },
            {
                $project: {
                    _id: 0,
                    clubId: '$_id',
                    clubName: '$club.name',
                    clubLocation: '$club.location',
                    clubImage: '$club.image',
                    totalFeedback: 1,
                    positiveCount: 1,
                    negativeCount: 1,
                    avgRating: { $round: ['$avgRating', 1] },
                    positivityScore: 1,
                    positivityPct: {
                        $cond: [
                            { $gt: ['$totalFeedback', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$positiveCount', '$totalFeedback'] }, 100] }, 0] },
                            0
                        ]
                    }
                }
            },
            { $sort: { positivityPct: -1, avgRating: -1, positivityScore: -1 } }
        ]);

        res.json(rankings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Permanently delete feedback
// @route   DELETE /api/feedback/:id/permanent
// @access  Private/SYSTEM_ADMIN
const permanentDeleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

        await feedback.deleteOne();
        res.status(200).json({ message: 'Feedback permanently deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    submitFeedback,
    getFeedback,
    updateFeedback,
    deleteFeedback,
    notifyAssignee,
    restoreFeedback,
    permanentDeleteFeedback,
    getClubRankings
};
