const mongoose = require('mongoose');
const Feedback = require('../models/Feedback.model');
const User = require('../models/User.model');
const Club = require('../models/Club.model');
require('dotenv').config();

async function restoreFeedback() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clubchainapp');
    console.log('Connected to MongoDB');
    
    const existingCount = await Feedback.countDocuments();
    console.log('Existing feedback:', existingCount);
    
    if (existingCount === 0) {
      const users = await User.find({ role: 'CLIENT' }).limit(4);
      const clubs = await Club.find().limit(3);
      
      console.log('Found users:', users.length, 'clubs:', clubs.length);
      
      if (users.length >= 4 && clubs.length >= 2) {
        await Feedback.insertMany([
          { userId: users[0]._id, clubId: clubs[0]._id, rating: 5, message: 'Excellent facilities!', sentiment: 'positive', sentimentScore: 0.98, type: 'general', status: 'resolved' },
          { userId: users[2]._id, clubId: clubs[1]._id, rating: 2, message: 'The equipment is quite old and slow', sentiment: 'negative', sentimentScore: 0.85, type: 'complaint', status: 'pending' },
          { userId: users[1]._id, clubId: clubs[0]._id, rating: 4, message: 'Love the new app design!', sentiment: 'positive', sentimentScore: 0.90, type: 'feature', status: 'pending' },
          { userId: users[3]._id, clubId: clubs[0]._id, rating: 1, message: 'Login is broken on Android', sentiment: 'negative', sentimentScore: 0.15, type: 'bug', status: 'pending' }
        ]);
        console.log('✅ Feedback restored: 4 entries added');
      } else {
        console.log('⚠️ Not enough users or clubs');
      }
    } else {
      console.log('✅ Feedback already exists:', existingCount);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

restoreFeedback();
