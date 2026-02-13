const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load env from root or current dir
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;

async function testConnection() {
    console.log('🔍 Testing connection to:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ SUCCESS! Your project can talk to MongoDB Atlas.');
        const db = client.db('clubchainapp');
        await db.collection('connection_test').insertOne({
            test: 'success',
            timestamp: new Date()
        });
        console.log('✅ DATABASE CREATED! Refresh Atlas and look for "clubchainapp".');
    } catch (err) {
        console.error('❌ CONNECTION FAILED:');
        console.error(err.message);

        if (err.message.includes('IP not in whitelist')) {
            console.log('\n💡 SOLUTION: You need to whitelist your current IP address in the MongoDB Atlas dashboard under "Network Access".');
        } else if (err.message.includes('MODULE_NOT_FOUND')) {
            console.log('\n💡 SOLUTION: You are missing a local package. Run: npm install @mongodb-js/saslprep');
        } else if (err.message.includes('Authentication failed')) {
            console.log('\n💡 SOLUTION: The username or password in .env is incorrect.');
        }
    } finally {
        await client.close();
    }
}

testConnection();
