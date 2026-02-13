const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const loadEnv = require('./config/env');

// Load environment variables
loadEnv();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
    origin: true, // Allow any origin (including capacitor://localhost)
    credentials: true, // Allow cookies/headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));
app.options('*', cors()); // Enable pre-flight for all routes
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/clubs', require('./routes/clubs.routes'));
app.use('/api/members', require('./routes/members.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/tasks', require('./routes/tasks.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/intro-letters', require('./routes/introLetter.routes'));
app.use('/api/events', require('./routes/events.routes'));
app.use('/api/membership-plans', require('./routes/membershipPlan.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/support', require('./routes/support.routes'));
app.use('/api/settings', require('./routes/settings.routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'API is running' }));

module.exports = app;
