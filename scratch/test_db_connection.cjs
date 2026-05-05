const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const testConnection = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('SUCCESS: MongoDB Atlas Connection established.');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        process.exit(0);
    } catch (err) {
        console.error('FAILURE: MongoDB Atlas Connection failed.');
        console.error(err);
        process.exit(1);
    }
};

testConnection();
