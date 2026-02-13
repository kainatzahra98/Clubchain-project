const IntroductionLetter = require('../models/IntroductionLetter.model');
const User = require('../models/User.model');
const Club = require('../models/Club.model');
const Membership = require('../models/Membership.model');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Task = require('../models/Task.model');
const Notification = require('../models/Notification.model');

// @desc    Request an introduction letter
// @route   POST /api/intro-letters/request
// @access  Private (Client)
exports.requestLetter = async (req, res) => {
    try {
        const { targetClubId, visitDate, purpose, homeClubId } = req.body;
        const memberId = req.user.id;

        console.log('[DEBUG] requestLetter - Body:', req.body);

        let homeClub;

        if (homeClubId) {
            // Validate specific home club membership
            const membership = await Membership.findOne({
                userId: memberId,
                clubId: homeClubId,
                status: 'active'
            });
            if (!membership) {
                return res.status(400).json({ message: 'You do not have an active membership with the selected home club.' });
            }
            homeClub = await Club.findById(homeClubId);
        } else {
            // Fallback to user's first active membership
            const membership = await Membership.findOne({
                userId: memberId,
                status: 'active'
            }).populate('clubId');

            if (!membership) {
                return res.status(400).json({ message: 'You must be an active member of a club to request an introduction letter.' });
            }
            homeClub = membership.clubId;
        }

        if (!homeClub) {
            return res.status(400).json({ message: 'Home club not found or not active.' });
        }

        if (homeClub._id.toString() === targetClubId) {
            return res.status(400).json({ message: 'You cannot request an introduction letter for your own home club.' });
        }

        // Verify Affiliation
        const isAffiliated = homeClub.affiliatedClubs.some(id => id.toString() === targetClubId);
        if (!isAffiliated) {
            return res.status(400).json({ message: `This club is not affiliated with ${homeClub.name}.` });
        }

        const letter = await IntroductionLetter.create({
            memberId,
            homeClubId: homeClub._id,
            targetClubId,
            visitDate,
            purpose,
            duration: parseInt(req.body.duration) || 1
        });

        await Task.create({
            title: 'Intro Letter Request',
            description: `${req.user.name || 'A member'} requested a letter to visit ${homeClub.affiliatedClubs.find(c => c._id.toString() === targetClubId)?.name || 'a club'}.`,
            clubId: homeClub._id,
            type: 'INTRO_LETTER_APPROVAL',
            priority: 'medium',
            relatedId: letter._id,
            relatedModel: 'IntroductionLetter'
        });

        res.status(201).json(letter);
    } catch (error) {
        console.error('[ERROR] requestLetter:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
    }
};

// @desc    Get my letters
// @route   GET /api/intro-letters/my
// @access  Private (Client)
exports.getMyLetters = async (req, res) => {
    try {
        const letters = await IntroductionLetter.find({ memberId: req.user.id })
            .populate('homeClubId', 'name')
            .populate('targetClubId', 'name')
            .sort({ createdAt: -1 });
        res.json(letters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get pending letters for home club admin
// @route   GET /api/intro-letters/pending
// @access  Private (Club Admin)
exports.getPendingLetters = async (req, res) => {
    try {
        // Admin can only see requests FROM their own members (Home Club)
        const admin = await User.findById(req.user.id);

        const letters = await IntroductionLetter.find({
            homeClubId: admin.clubId,
            status: 'PENDING'
        })
            .populate('memberId', 'name email')
            .populate('targetClubId', 'name')
            .sort({ createdAt: -1 });

        res.json(letters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve or Reject letter
// @route   PUT /api/intro-letters/:id/status
// @access  Private (Club Admin)
exports.updateLetterStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const letter = await IntroductionLetter.findById(req.params.id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        // Verify admin belongs to the home club
        const admin = await User.findById(req.user.id).populate('clubId');
        if (letter.homeClubId.toString() !== admin.clubId.toString() && admin.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to approve for this club' });
        }

        const result = await exports.processLetterApproval(letter, status, rejectionReason, admin);

        res.json({ message: `Letter ${status.toLowerCase()} successfully`, letter: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Logic shared between task handler and direct letter update
exports.processLetterApproval = async (letter, status, rejectionReason, admin) => {
    letter.status = status;
    if (status === 'REJECTED') {
        letter.rejectionReason = rejectionReason;
    } else if (status === 'APPROVED') {
        const visit = new Date(letter.visitDate);
        const duration = letter.duration || 1;
        const expiryDate = new Date(visit);
        expiryDate.setDate(visit.getDate() + duration);
        letter.expiryDate = expiryDate;

        const payload = {
            letterId: letter._id,
            memberId: letter.memberId,
            homeClubId: letter.homeClubId,
            type: 'INTRO_LETTER'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
        letter.qrToken = token;

        // Notify Member
        await Notification.create({
            userId: letter.memberId,
            type: 'alert',
            title: 'Intro Letter Approved!',
            message: `Your request to visit a club has been approved. You can now download your letter with QR code.`,
            relatedId: letter._id
        });

        // Notify Target Club (via Task)
        await Task.create({
            title: 'Incoming Visitor Expected',
            description: `A member from ${admin.clubId.name || 'affiliated club'} has been approved for a visit on ${new Date(letter.visitDate).toLocaleDateString()}.`,
            clubId: letter.targetClubId,
            type: 'NOTIFICATION',
            priority: 'low',
            relatedId: letter._id,
            relatedModel: 'IntroductionLetter'
        });
    }

    await letter.save();

    // Update corresponding Task for Home Club
    await Task.findOneAndUpdate(
        { relatedId: letter._id, type: 'INTRO_LETTER_APPROVAL' },
        { status: status === 'APPROVED' ? 'completed' : 'cancelled' }
    );

    // If Approved, create Task for Target Club
    if (status === 'APPROVED') {
        const title = `Incoming Visitor: ${letter.memberId.name}`;
        await Task.create({
            clubId: letter.targetClubId,
            type: 'VISIT_CONFIRMATION',
            title: title,
            description: `${title} from ${admin.clubId.name || 'Home Club'} on ${new Date(letter.visitDate).toLocaleDateString()}`,
            relatedId: letter._id,
            relatedModel: 'IntroductionLetter',
            status: 'pending',
            dueDate: letter.visitDate
        });
    }

    return letter;
};

// @desc    Download Letter PDF
// @route   GET /api/intro-letters/:id/download
// @access  Private (Owner or Target Club Admin)
exports.downloadLetter = async (req, res) => {
    try {
        // Support query token for mobile browser download
        if (req.query.token && !req.user) {
            try {
                const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id).select('-password');
            } catch (err) {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        const letter = await IntroductionLetter.findById(req.params.id)
            .populate('memberId', 'name email')
            .populate('homeClubId', 'name location')
            .populate('targetClubId', 'name location');

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (letter.status !== 'APPROVED' && letter.status !== 'ACCEPTED') {
            return res.status(400).json({ message: 'Letter is not valid (must be Approved or Accepted)' });
        }

        // Generate QR Code Data URL
        const qrCodeDataUrl = await QRCode.toDataURL(letter.qrToken);

        const doc = new PDFDocument();

        // Stream PDF to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=IntroLetter-${letter._id}.pdf`);
        doc.pipe(res);

        // PDF Content
        doc.fontSize(25).text('Introduction Letter', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Letter ID: ${letter._id}`, { align: 'center', color: 'grey' });
        doc.moveDown();
        if (letter.status === 'ACCEPTED') {
            doc.save();
            doc.rotate(-45, { origin: [300, 300] });
            doc.fontSize(50).fillColor('green').text('VISIT CONFIRMED', 100, 300, { align: 'center', opacity: 0.3 });
            doc.restore();
        }

        doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        doc.text(`To: The Management of ${letter.targetClubId.name}`);
        doc.text(`Location: ${letter.targetClubId.location}`);
        doc.moveDown();

        doc.text('Subject: Letter of Introduction');
        doc.moveDown();

        doc.text(`We are pleased to introduce our valued member, ${letter.memberId.name}, who is a member in good standing at ${letter.homeClubId.name}.`);
        doc.moveDown();

        doc.text(`Please extend to them the courtesies of your club during their visit on ${new Date(letter.visitDate).toLocaleDateString()}.`);
        doc.moveDown();

        doc.text(`Purpose of Visit: ${letter.purpose}`);
        doc.moveDown();

        // Include Membership Details
        const membership = await Membership.findOne({
            userId: letter.memberId._id,
            clubId: letter.homeClubId._id,
            status: 'active'
        }).populate('planId');

        if (membership && membership.planId) {
            doc.fontSize(14).text('Membership Subscription Details:', { underline: true });
            doc.fontSize(12).text(`Plan: ${membership.planId.title}`);
            doc.moveDown(0.5);
            doc.text('Included Services:');
            (membership.planId.features || []).forEach(feature => {
                doc.text(`- ${feature}`, { indent: 20 });
            });
            doc.moveDown();
        }

        doc.moveDown();
        doc.moveDown();
        if (letter.status === 'ACCEPTED') {
            doc.fontSize(12).fillColor('black').text('Status: VERIFIED ENTRY', { align: 'center', color: 'green' });
            doc.fontSize(10).text(`This letter was accepted and verified by ${letter.targetClubId.name}`, { align: 'center' });
        } else {
            doc.fontSize(12).text('Verification QR Code:', { align: 'center' });
            doc.moveDown(0.5);
            doc.image(qrCodeDataUrl, { fit: [150, 150], x: (doc.page.width - 150) / 2 });
            doc.moveDown();
            doc.text('Scan this code at the visiting club reception', { align: 'center', size: 10, color: 'grey' });
        }

        doc.moveDown();
        doc.moveDown();
        doc.fontSize(10).text(`Letter Expiry: ${new Date(letter.expiryDate).toLocaleDateString()}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Verify QR Code
// @route   POST /api/intro-letters/verify
// @access  Private (Club Admin)
exports.verifyLetter = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ isValid: false, message: 'No token provided' });
        }

        // Verify signature
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ isValid: false, message: 'Invalid or Expired QR Signature' });
        }

        if (decoded.type !== 'INTRO_LETTER') {
            return res.status(400).json({ isValid: false, message: 'Invalid QR Type' });
        }

        // Check against DB
        const letter = await IntroductionLetter.findById(decoded.letterId)
            .populate('memberId', 'name email status') // Included status
            .populate('homeClubId', 'name')
            .populate('targetClubId', 'name');

        if (!letter) {
            return res.status(404).json({ isValid: false, message: 'Letter record not found' });
        }

        if (letter.status !== 'APPROVED') {
            return res.status(400).json({ isValid: false, message: `Letter is ${letter.status}` });
        }

        if (new Date() > new Date(letter.expiryDate)) {
            return res.status(400).json({ isValid: false, message: 'Letter has expired' });
        }

        // Check if verifying admin belongs to target club or home club (or system admin)
        // Ideally, Target Club verifies.
        const admin = await User.findById(req.user.id);

        // We allow verifying if you are admin of target OR home OR system admin
        // But the main use case is target club
        const isTargetAdmin = admin.clubId && admin.clubId.toString() === letter.targetClubId._id.toString();
        const isHomeAdmin = admin.clubId && admin.clubId.toString() === letter.homeClubId._id.toString();
        const isSystemAdmin = admin.role === 'SYSTEM_ADMIN';

        if (!isTargetAdmin && !isHomeAdmin && !isSystemAdmin) {
            return res.status(403).json({ isValid: false, message: 'Not authorized to verify this letter' });
        }

        // Additional Membership Check: Ensure member account is still ACTIVE
        if (letter.memberId.status === 'DELETED') {
            return res.status(400).json({ isValid: false, message: 'Member account no longer exists' });
        }

        // Check for active membership at high level
        // Check for membership (any status)
        const membership = await Membership.findOne({
            userId: letter.memberId._id,
            clubId: letter.homeClubId._id
        }).populate('planId', 'title features');

        if (!membership) {
            return res.status(400).json({ isValid: false, message: 'No membership record found with the home club' });
        }

        // Check expiry manually if status is active
        let memberStatus = membership.status;
        let isValid = memberStatus === 'active';

        if (memberStatus === 'active' && membership.expiresAt && new Date(membership.expiresAt) < new Date()) {
            memberStatus = 'expired';
            isValid = false;
        }

        const responseData = {
            isValid,
            message: isValid ? 'Valid Membership' : 'Membership Not Active',
            letterId: letter._id,
            member: {
                name: letter.memberId.name,
                email: letter.memberId.email,
                homeClub: letter.homeClubId.name,
                plan: membership.planId?.title || 'Standard',
                features: membership.planId?.features || [],
                status: memberStatus,
                expiresAt: membership.expiresAt,
                notes: membership.notes || ''
            },
            letter: {
                visitDate: letter.visitDate,
                purpose: letter.purpose,
                expiryDate: letter.expiryDate
            }
        };

        res.json(responseData);

        // Auto-accept logic removed to rely on explicit confirmation from frontend.
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get incoming visitors for target club admin
// @route   GET /api/intro-letters/incoming
// @access  Private (Club Admin)
exports.getIncomingVisitors = async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);
        if (!admin.clubId) {
            return res.status(400).json({ message: 'Admin is not associated with any club' });
        }

        const letters = await IntroductionLetter.find({
            targetClubId: admin.clubId,
            status: { $in: ['APPROVED', 'ACCEPTED'] }
        })
            .populate('memberId', 'name email image')
            .populate('homeClubId', 'name')
            .sort({ visitDate: 1 });

        res.json(letters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all letters for system admin
// @route   GET /api/intro-letters/admin/all
// @access  Private (System Admin)
exports.adminGetAllLetters = async (req, res) => {
    try {
        const letters = await IntroductionLetter.find()
            .populate('memberId', 'name email')
            .populate('homeClubId', 'name')
            .populate('targetClubId', 'name')
            .sort({ createdAt: -1 });
        res.json(letters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Accept member visit (by Target Club)
// @route   PUT /api/intro-letters/:id/accept
// @access  Private (Target Club Admin)
exports.acceptLetter = async (req, res) => {
    try {
        const letter = await IntroductionLetter.findById(req.params.id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (letter.status !== 'APPROVED') {
            return res.status(400).json({ message: `Cannot accept a letter with status: ${letter.status}` });
        }

        const admin = await User.findById(req.user.id);
        if (letter.targetClubId.toString() !== admin.clubId.toString() && admin.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to accept for this club' });
        }

        letter.status = 'ACCEPTED';
        await letter.save();

        // Close the Visit Confirmation Task
        await Task.findOneAndUpdate(
            { relatedId: letter._id, type: 'VISIT_CONFIRMATION' },
            { status: 'completed' }
        );

        // Notify Member
        await Notification.create({
            userId: letter.memberId,
            type: 'alert',
            title: 'Visit Confirmed!',
            message: `Your visit to ${admin.clubId.toString() === letter.targetClubId.toString() ? 'our club' : 'the target club'} has been accepted. Enjoy your stay!`,
            relatedId: letter._id
        });

        res.json({ message: 'Visit accepted successfully', letter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject member visit (by Target Club)
// @route   PUT /api/intro-letters/:id/reject
// @access  Private (Target Club Admin)
exports.rejectLetter = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const letter = await IntroductionLetter.findById(req.params.id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        // Allow rejecting if CURRENTLY Approved (pending visit) or even if Accepted (revoking)?
        // Use case: Rejecting the *request to visit*. Usually when status is APPROVED (before visit).
        if (letter.status !== 'APPROVED') {
            return res.status(400).json({ message: `Cannot reject a letter with status: ${letter.status}` });
        }

        const admin = await User.findById(req.user.id);
        if (letter.targetClubId.toString() !== admin.clubId.toString() && admin.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to reject for this club' });
        }

        letter.status = 'REJECTED';
        letter.rejectionReason = rejectionReason || 'Visit decliend by target club';
        await letter.save();

        // Close the Visit Confirmation Task (as rejected/cancelled)
        await Task.findOneAndUpdate(
            { relatedId: letter._id, type: 'VISIT_CONFIRMATION' },
            { status: 'rejected' }
        );

        // Notify Member
        await Notification.create({
            userId: letter.memberId,
            type: 'alert',
            title: 'Visit Request Declined',
            message: `Your visit to ${admin.clubId.toString() === letter.targetClubId.toString() ? 'our club' : 'the target club'} was declined. Reason: ${rejectionReason || 'Club discretion'}. Please check your membership status or contact support.`,
            relatedId: letter._id
        });

        res.json({ message: 'Visit rejected successfully', letter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
