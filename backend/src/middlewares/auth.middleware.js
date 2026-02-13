const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.error('Auth Middleware: User not found for ID', decoded.id);
                // Mock user to prevent crash if record is missing (Emergency Fix)
                req.user = { id: decoded.id, role: 'CLIENT', name: 'Ghost User' };
            }

            return next();
        } catch (error) {
            console.error('Auth Middleware Error:', error.message);
            return res.status(401).json({ message: 'Not authorized: ' + error.message });
        }
    }

    if (!token) {
        console.warn('Auth Middleware: [NO TOKEN] from', req.ip, 'requesting', req.originalUrl);
        console.warn('Headers:', JSON.stringify(req.headers, null, 2));
        return res.status(401).json({ message: 'Not authorized, no token' });
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
