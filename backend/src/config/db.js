const mongoose = require('mongoose');

let cachedDb = global.mongoose;

if (!cachedDb) {
    cachedDb = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cachedDb.conn) {
        return cachedDb.conn;
    }

    if (!cachedDb.promise) {
        const opts = {
            family: 4 // Force IPv4
        };

        cachedDb.promise = mongoose.connect(process.env.MONGODB_URI, opts).then((mongoose) => {
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
            return mongoose;
        }).catch((error) => {
            console.error(`MongoDB Connection Error: ${error.message}`);
            cachedDb.promise = null; // reset so next request retries
            // In serverless, don't exit process, just throw error
            throw error; 
        });
    }

    try {
        cachedDb.conn = await cachedDb.promise;
    } catch (e) {
        cachedDb.promise = null;
        throw e;
    }

    return cachedDb.conn;
};

module.exports = connectDB;
