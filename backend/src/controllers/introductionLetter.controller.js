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

        const targetClub = await Club.findById(targetClubId).select('name');

        await Task.create({
            title: 'Intro Letter Request',
            description: `${req.user.name || 'A member'} requested a letter to visit ${targetClub?.name || 'an affiliated club'}.`,
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
        const letter = await IntroductionLetter.findById(req.params.id)
            .populate('memberId', 'name email')
            .populate('homeClubId', 'name')
            .populate('targetClubId', 'name');

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        // Verify admin belongs to the home club
        const admin = await User.findById(req.user.id).populate('clubId');
        
        const letterHomeId = letter.homeClubId._id ? letter.homeClubId._id.toString() : letter.homeClubId.toString();
        const adminClubId = admin.clubId?._id ? admin.clubId._id.toString() : admin.clubId?.toString();

        if (letterHomeId !== adminClubId && admin.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to approve for this club' });
        }

        const result = await exports.processLetterApproval(letter, status, rejectionReason, admin);

        res.json({ message: `Letter ${status.toLowerCase()} successfully`, letter: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get processed letters for home club admin (History)
// @route   GET /api/intro-letters/processed
// @access  Private (Club Admin)
exports.getProcessedLetters = async (req, res) => {
    try {
        const admin = await User.findById(req.user.id);
        if (!admin.clubId) {
            return res.status(400).json({ message: 'Admin is not associated with any club' });
        }

        const letters = await IntroductionLetter.find({
            $or: [
                { homeClubId: admin.clubId, status: { $ne: 'PENDING' } },
                { targetClubId: admin.clubId, status: { $in: ['ACCEPTED', 'REJECTED'] } }
            ]
        })
            .populate('memberId', 'name email image')
            .populate('homeClubId', 'name')
            .populate('targetClubId', 'name')
            .sort({ updatedAt: -1 });

        res.json(letters);
    } catch (error) {
        console.error('[ERROR] getProcessedLetters:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Logic shared between task handler and direct letter update
exports.processLetterApproval = async (letter, status, rejectionReason, admin) => {
    letter.status = status;
    if (status === 'REJECTED') {
        letter.rejectionReason = rejectionReason;

        // Notify Member of Rejection
        await Notification.create({
            userId: letter.memberId,
            type: 'alert',
            title: 'Intro Letter Request Declined',
            message: `Your request for an Introduction Letter was declined. Reason: ${rejectionReason || 'Club discretion'}.`,
            relatedId: letter._id
        });
    } else if (status === 'APPROVED') {
        const visit = new Date(letter.visitDate);
        const duration = letter.duration || 1;
        const expiryDate = new Date(visit);
        expiryDate.setDate(visit.getDate() + duration);
        letter.expiryDate = expiryDate;

        // Generate QR Token for authenticity verification
        const payload = {
            letterId: letter._id,
            memberId: letter.memberId?._id || letter.memberId,
            homeClubId: letter.homeClubId?._id || letter.homeClubId,
            type: 'INTRO_LETTER'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
        letter.qrToken = token;

        // Notify Member
        await Notification.create({
            userId: letter.memberId?._id || letter.memberId,
            type: 'alert',
            title: 'Request Approved by Home Club',
            message: `Your visit request has been approved by ${admin.clubId?.name || 'your home club'}. You can now download your letter for authenticity verification. It has been sent to the destination club for final confirmation.`,
            relatedId: letter._id
        });

        // Notify Target Club (via Task)
        await Task.create({
            title: 'Incoming Visitor Expected',
            description: `A member from ${admin.clubId?.name || 'affiliated club'} has been approved for a visit on ${new Date(letter.visitDate).toLocaleDateString()}.`,
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
            description: `${title} from ${admin.clubId?.name || 'Home Club'} on ${new Date(letter.visitDate).toLocaleDateString()}`,
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
            return res.status(400).json({ message: 'Letter is not valid (must be Approved by Home Club or Accepted by Destination)' });
        }

        // If letter is only APPROVED (not yet ACCEPTED), we might want to restrict certain info or add a warning
        const isFullyAccepted = letter.status === 'ACCEPTED';

        // Generate High-Res QR Code Data URL if token exists
        let qrCodeDataUrl = null;
        if (letter.qrToken) {
            qrCodeDataUrl = await QRCode.toDataURL(letter.qrToken, { width: 500, margin: 2 });
        }

        const doc = new PDFDocument();

        // Stream PDF to client
        res.setHeader('Content-Type', 'application/pdf');

        // Determine whether to view (inline) or download (attachment)
        const disposition = req.query.type === 'view' ? 'inline' : 'attachment';
        res.setHeader('Content-Disposition', `${disposition}; filename=IntroLetter-${letter._id}.pdf`);

        doc.pipe(res);

        // --- PDF DESIGN ---
        const pageW = doc.page.width;
        const margin = 50;

        // Add a subtle border
        doc.rect(20, 20, pageW - 40, doc.page.height - 40).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // Watermark for Confirmed but not yet activated visits (Drawn first so it's in background)
        if (letter.status === 'ACCEPTED' && !letter.visitStartedAt) {
            doc.save();
            doc.fontSize(60).fillColor('#10b981', 0.1).rotate(-45, { origin: [pageW / 2, 400] });
            doc.text('VISIT CONFIRMED', 0, 400, { align: 'center', width: pageW });
            doc.restore();
        }

        // Header Section
        const isOfficial = letter.status === 'ACCEPTED' || letter.visitStartedAt;
        const mainTitle = isOfficial ? 'Official Certificate of Introduction' : 'Letter of Introduction';

        doc.y = 50;
        doc.x = margin;
        doc.fillColor('#1e293b').fontSize(22).text(mainTitle, { align: 'center', fontWeight: 'bold' });
        doc.fontSize(8).fillColor('#64748b').text(`Document Reference: ${letter._id}`, { align: 'center' });
        doc.moveDown(1);

        // Top Info Row
        const topY = doc.y;
        doc.fillColor('#0f172a').fontSize(10).text(`Issued: ${new Date(letter.createdAt).toLocaleDateString()}`, margin, topY, { align: 'left' });
        doc.text(`Expiry: ${new Date(letter.expiryDate).toLocaleDateString()}`, margin, topY, { align: 'right' });
        
        doc.x = margin;
        doc.y = topY + 30;

        // Two Column Info (From / To)
        const colW = (pageW - (margin * 2)) / 2;
        const midY = doc.y;
        
        // Home Club (From)
        doc.fontSize(10).fillColor('#64748b').text('HOME CLUB', margin, midY);
        doc.fontSize(12).fillColor('#0f172a').text(letter.homeClubId.name, margin, midY + 15, { width: colW, fontWeight: 'bold' });
        
        // Target Club (To)
        doc.fontSize(10).fillColor('#64748b').text('DESTINATION CLUB', margin + colW, midY);
        doc.fontSize(12).fillColor('#0f172a').text(letter.targetClubId.name, margin + colW, midY + 15, { width: colW, fontWeight: 'bold' });
        doc.fontSize(9).text(letter.targetClubId.location || 'Affiliated Location', margin + colW, midY + 30);
        
        doc.x = margin;
        doc.y = midY + 70;

        // Body Section
        const subject = isOfficial ? 'Subject: Confirmation of Reciprocal Privileges' : 'Subject: Official Introduction of Club Member';
        doc.fontSize(11).fillColor('#334155').text(subject, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#334155').text(`This certificate confirms that `, { continued: true });
        doc.fillColor('#0f172a').fontSize(11).text(letter.memberId.name, { fontWeight: 'bold', continued: true });
        doc.fillColor('#334155').fontSize(10).text(` is a verified member in good standing at `, { continued: true });
        doc.fillColor('#0f172a').text(`${letter.homeClubId.name}.`, { fontWeight: 'bold' });
        
        doc.moveDown(0.5);
        doc.fillColor('#334155').text(`We authorize and request that your club extends standard reciprocal privileges to them during their visit.`);
        
        doc.moveDown(1.5);
        
        // Visit Details Box
        const visitBoxY = doc.y;
        doc.rect(margin, visitBoxY, pageW - (margin * 2), 50).fill('#f8fafc');
        
        doc.x = margin + 15;
        doc.y = visitBoxY + 10;
        doc.fillColor('#475569').fontSize(9).text('VISIT PASS DETAILS');
        doc.moveDown(0.2);
        doc.fillColor('#0f172a').fontSize(10).text(`Approved Date: ${new Date(letter.visitDate).toLocaleDateString()}  |  Duration: ${letter.duration} Day(s)`);
        doc.text(`Purpose: ${letter.purpose}`);
        
        doc.x = margin;
        doc.y = visitBoxY + 65;

        // Membership Box
        const membership = await Membership.findOne({
            userId: letter.memberId._id,
            clubId: letter.homeClubId._id,
            status: 'active'
        }).populate('planId');

        if (membership && membership.planId) {
            const planBoxY = doc.y;
            doc.rect(margin, planBoxY, pageW - (margin * 2), 60).fill('#f1f5f9');
            
            doc.x = margin + 15;
            doc.y = planBoxY + 10;
            doc.fillColor('#475569').fontSize(9).text('MEMBERSHIP TIER');
            doc.moveDown(0.2);
            doc.fillColor('#0f172a').fontSize(11).text(membership.planId.title, { fontWeight: 'bold' });
            
            const features = (membership.planId.features || []).slice(0, 4).join(' • ');
            doc.fontSize(9).fillColor('#64748b').text(features, { width: pageW - (margin * 2) - 30 });
            
            doc.x = margin;
            doc.y = planBoxY + 75;
        }

        // Verification Footer (QR or Activated Status)
        doc.moveDown(1);
        const footerY = doc.y;

        if (letter.visitStartedAt) {
            doc.rect(margin, footerY, pageW - (margin * 2), 50).fill('#ecfdf5');
            doc.x = margin;
            doc.y = footerY + 15;
            doc.fillColor('#059669').fontSize(14).text('✓ SECURE ENTRY VERIFIED', { align: 'center', fontWeight: 'bold' });
            doc.fontSize(9).fillColor('#065f46').text(`Scan Authorized at ${new Date(letter.visitStartedAt).toLocaleString()}`, { align: 'center' });
        } else if (qrCodeDataUrl) {
            doc.x = margin;
            doc.y = footerY;
            doc.fillColor('#1e293b').fontSize(10).text('OFFICIAL ACTIVATION CODE', { align: 'center', fontWeight: 'bold' });
            doc.moveDown(1);
            const qrSize = 140;
            const qrX = (pageW - qrSize) / 2;
            const qrY = doc.y;
            
            // Draw a solid white background to block the watermark
            // Padding only goes up by 5px so it doesn't clip the text above
            doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10).fill('white');
            
            doc.image(qrCodeDataUrl, { fit: [qrSize, qrSize], x: qrX, y: qrY });
            
            doc.y = qrY + qrSize + 10;
            doc.x = margin;
            doc.fontSize(8).fillColor('#64748b').text('Reception: Scan this code to authenticate and activate the visit.', { align: 'center' });
            
            if (letter.status === 'APPROVED') {
                doc.moveDown(0.5);
                doc.fontSize(9).fillColor('#b45309').text('AUTHENTICITY VERIFIED • Awaiting Destination Confirmation', { align: 'center', fontWeight: 'bold' });
            }
        }

        // Final Stamp/Note
        doc.moveDown(2);
        doc.fontSize(7).fillColor('#94a3b8').text('This document is electronically generated and verified via the ClubChain Secure Network.', { align: 'center' });

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

        if (letter.status !== 'APPROVED' && letter.status !== 'ACCEPTED') {
            return res.status(400).json({ isValid: false, message: `Visit is ${letter.status}` });
        }

        if (new Date() > new Date(letter.expiryDate)) {
            return res.status(400).json({ isValid: false, message: 'Letter has expired' });
        }

        if (letter.visitStartedAt) {
            return res.status(400).json({ isValid: false, message: 'This QR code has already been scanned and activated' });
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
            letterStatus: letter.status,
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

        // Include EXPIRED so they can see past visitors and notify them to re-request
        const letters = await IntroductionLetter.find({
            targetClubId: admin.clubId,
            status: { $in: ['APPROVED', 'ACCEPTED', 'EXPIRED'] }
        })
            .populate('memberId', 'name email image')
            .populate('homeClubId', 'name')
            .sort({ visitDate: -1 });

        // Manually attach membership/plan info for each visitor
        const enrichedLetters = await Promise.all(letters.map(async (letter) => {
            const membership = await Membership.findOne({
                userId: letter.memberId?._id,
                clubId: letter.homeClubId?._id
            }).populate('planId');

            const letterObj = letter.toObject();
            letterObj.membership = membership;
            return letterObj;
        }));

        res.json(enrichedLetters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Notify member to re-request visit
// @route   POST /api/intro-letters/:id/notify-re-request
// @access  Private (Club Admin)
exports.notifyMemberToReRequest = async (req, res) => {
    try {
        const letter = await IntroductionLetter.findById(req.params.id).populate('targetClubId', 'name');
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        const admin = await User.findById(req.user.id);

        // Robust check for authorization
        const isAdminForClub = admin.clubId && letter.targetClubId && letter.targetClubId._id.toString() === admin.clubId.toString();
        const isSystemAdmin = admin.role === 'SYSTEM_ADMIN';

        if (!isAdminForClub && !isSystemAdmin) {
            return res.status(403).json({ message: 'Not authorized for this club' });
        }

        const targetClubName = letter.targetClubId?.name || "the club";

        const newNotification = await Notification.create({
            userId: letter.memberId,
            type: 'alert',
            title: 'Visit Expired / Expiring',
            message: `Your visit to ${targetClubName} has expired or is expiring soon. If you wish to continue your visit, please request a new Introduction Letter through the app.`,
            relatedId: letter._id
        });

        res.json({
            message: 'Notification sent successfully',
            notificationId: newNotification._id,
            recipientId: newNotification.userId
        });

    } catch (error) {
        console.error('[ERROR] notifyMemberToReRequest:', error);
        res.status(500).json({ message: 'Server Error: ' + error.message });
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
        const adminClubId = admin.clubId ? admin.clubId.toString() : null;
        const targetClubIdStr = letter.targetClubId ? letter.targetClubId.toString() : '';

        if (targetClubIdStr !== adminClubId && admin.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to accept for this club' });
        }

        letter.status = 'ACCEPTED';
        
        // Generate QR code upon acceptance
        const payload = {
            letterId: letter._id,
            memberId: letter.memberId,
            homeClubId: letter.homeClubId,
            type: 'INTRO_LETTER'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
        letter.qrToken = token;

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
            message: `Your visit to ${admin.clubId && admin.clubId.toString() === letter.targetClubId.toString() ? 'our club' : 'the target club'} has been accepted. Enjoy your stay!`,
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
        const adminClubId = admin.clubId ? admin.clubId.toString() : null;
        const targetClubIdStr = letter.targetClubId ? letter.targetClubId.toString() : '';

        if (targetClubIdStr !== adminClubId && admin.role !== 'SYSTEM_ADMIN') {
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
            message: `Your visit to ${admin.clubId && admin.clubId.toString() === letter.targetClubId.toString() ? 'our club' : 'the target club'} was declined. Reason: ${rejectionReason || 'Club discretion'}. Please check your membership status or contact support.`,
            relatedId: letter._id
        });

        res.json({ message: 'Visit rejected successfully', letter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
// @desc    Activate Letter (On-site Scan)
// @route   PUT /api/intro-letters/:id/activate
// @access  Private (Target Club Admin)
exports.activateLetter = async (req, res) => {
    try {
        const letter = await IntroductionLetter.findById(req.params.id);
        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        if (letter.visitStartedAt) {
            return res.status(400).json({ message: 'Visit already activated' });
        }

        letter.status = 'ACCEPTED';
        letter.visitStartedAt = new Date();
        
        // Finalize expiry from the moment of activation
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (letter.duration || 1));
        letter.expiryDate = expiryDate;

        await letter.save();

        res.json({ message: 'Visit activated successfully', letter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete Intro Letter
// @route   DELETE /api/intro-letters/:id
// @access  Private (Owner or Admin)
exports.deleteLetter = async (req, res) => {
    console.log(`[CONTROLLER DEBUG] deleteLetter called for ID: ${req.params.id}`);
    try {
        const letter = await IntroductionLetter.findById(req.params.id);

        if (!letter) {
            return res.status(404).json({ message: 'Letter not found' });
        }

        // Verify ownership or admin role
        if (letter.memberId.toString() !== req.user.id && req.user.role !== 'SYSTEM_ADMIN') {
            return res.status(403).json({ message: 'Not authorized to delete this letter' });
        }

        // Also delete associated tasks
        await Task.deleteMany({ relatedId: letter._id, relatedModel: 'IntroductionLetter' });

        await letter.deleteOne();

        res.json({ message: 'Letter and associated tasks removed successfully' });
    } catch (error) {
        console.error('[ERROR] deleteLetter:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
