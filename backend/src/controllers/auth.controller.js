const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendOtpEmail } = require('../services/email.service');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (for CLIENT only) / Private/SYSTEM_ADMIN (for admin roles)
const registerUser = async (req, res) => {
    const { name, email, password, role, clubId } = req.body;

    try {
        // Check if trying to create administrative roles
        if (role === 'SYSTEM_ADMIN' || role === 'SUPPORT_TEAM') {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer')) {
                return res.status(401).json({ message: 'Authentication required to create Admin users' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const requestingUser = await User.findById(decoded.id);

            // Strict SuperAdmin Check: Only admin@clubz.com can create other admins
            if (!requestingUser || requestingUser.email !== 'admin@clubz.com') {
                return res.status(403).json({ message: 'Only the SuperAdmin (admin@clubz.com) can create administrative users' });
            }
        }
        // Note: CLUB_ADMIN can self-register, no authentication required

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user (auto-verified, no OTP)
        user = await User.create({
            name,
            email,
            password,
            role: role || 'CLIENT',
            clubId,
            permissions: permissions || [],
            isVerified: true, // Auto-verify
            // Clients start as INACTIVE until they join a club
            status: role === 'CLIENT' ? 'INACTIVE' : 'ACTIVE'
        });

        if (user) {
            // Return user with token for auto-login
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clubId: user.clubId,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Verify user and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            clubId: user.clubId,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified' });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('>>> DEBUG OTP (Resend):', otp);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOtpEmail(user.email, otp);

        res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                // return res.status(401).json({ message: 'Please verify your email address' }); 
                // Temporarily allow unverified login for development to fix "Auth Loop" if caused by 403
                // return res.status(403).json({ message: 'Account not verified. Please verify your email.', isVerified: false });
            }

            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                clubId: user.clubId,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

// @desc    Update user details
// @route   PUT /api/auth/users/:id
// @access  Private/SYSTEM_ADMIN
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        user.status = req.body.status || user.status;
        user.permissions = req.body.permissions || user.permissions;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            status: updatedUser.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.body.name) user.name = req.body.name;
        if (req.body.phone) user.phone = req.body.phone;
        
        if (req.file) {
            user.avatar = `/uploads/${req.file.filename}`;
        }

        if (req.body.password) {
            // Check if current password is provided and matches
            if (!req.body.currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set a new password' });
            }
            const isMatch = await user.matchPassword(req.body.currentPassword);
            if (!isMatch) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
            clubId: updatedUser.clubId,
            token: generateToken(updatedUser._id),
            isVerified: updatedUser.isVerified
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user (Soft or Hard Delete)
// @route   DELETE /api/auth/users/:id
// @access  Private/SYSTEM_ADMIN
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check for hard delete parameter
        if (req.query.hard === 'true') {
            await user.deleteOne();
            return res.status(200).json({ message: 'User permanently deleted' });
        }

        // Soft delete: Change status instead of deleting from DB
        user.status = 'DELETED';
        await user.save();

        res.status(200).json({ message: 'User moved to trash bin' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all admins (System and Club)
// @route   GET /api/auth/admins
// @access  Private/ADMIN
const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({
            role: { $in: ['SYSTEM_ADMIN', 'SUPPORT_TEAM'] },
            status: { $ne: 'DELETED' }
        }).select('name email role clubId permissions');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('>>> DEBUG OTP (Forgot Password):', otp);
        // OTP expires in 10 minutes
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        await sendOtpEmail(user.email, otp);

        res.status(200).json({ message: 'Password reset OTP sent to email' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const validateResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        res.status(200).json({ message: 'Code verified' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const user = await User.findOne({ email }).select('+otp +otpExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired' });
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        user.otp = undefined;
        user.otpExpires = undefined;
        // If they verify their identity via OTP for password reset, we can consider them verified?
        // Let's safe bet and say yes IF they weren't already.
        if (!user.isVerified) user.isVerified = true;

        await user.save();

        res.status(200).json({ message: 'Password reset successful. Please login.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    updateUser,
    deleteUser,
    getAdmins,
    verifyOtp,
    resendOtp,
    forgotPassword,
    validateResetOtp,
    validateResetOtp,
    resetPassword,
    updateProfile
};
