const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
    let token;

    // 1. Extract from Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. Extract from Query Parameter (if not in header)
    else if (req.query.token) {
        token = req.query.token;
    }

    // DEBUG: Log specific details for download/view requests
    if (req.originalUrl.includes('/download') || req.originalUrl.includes('/intro-letters')) {
        console.log(`[AUTH DEBUG] URL: ${req.originalUrl}`);
        console.log(`[AUTH DEBUG] Token Found: ${!!token}`);
        if (token) console.log(`[AUTH DEBUG] Token Length: ${token.length}`);
    }

    if (!token) {
        console.warn(`[AUTH FAIL] No token provided for ${req.originalUrl}`);
        // Return debug info to client for diagnosis
        return res.status(401).json({
            message: 'Not authorized, no token',
            debug: {
                query: req.query,
                headers_auth: req.headers.authorization ? 'Present (masked)' : 'Missing',
                url: req.originalUrl
            }
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            console.error(`[AUTH FAIL] User not found for ID: ${decoded.id}`);
            // Graceful handling for deleted users in non-critical flows
            if (req.method === 'GET') {
                req.user = { id: decoded.id, role: 'CLIENT', name: 'Ghost User' };
            } else {
                return res.status(401).json({ message: 'User not found' });
            }
        }

        next();
    } catch (error) {
        console.error(`[AUTH ERROR] Token verification failed: ${error.message}`);
        return res.status(401).json({
            message: 'Not authorized: ' + error.message,
            debug: {
                token_preview: token.substring(0, 10) + '...',
                error: error.message
            }
        });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
