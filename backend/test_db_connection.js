const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        console.log("Attempting to connect to:", process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB Connected Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ MongoDB Connection Error:");
        console.error("Name:", error.name);
        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("CodeName:", error.codeName);
        process.exit(1);
    }
};

connectDB();
