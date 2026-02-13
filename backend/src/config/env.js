const dotenv = require('dotenv');
const path = require('path');

const loadEnv = () => {
    const result = dotenv.config({ path: path.join(__dirname, '../../../.env') });

    if (result.error) {
        console.warn('Warning: .env file not found. Using default environment variables.');
    }

    const required = ['MONGODB_URI', 'JWT_SECRET'];
    required.forEach(field => {
        if (!process.env[field]) {
            console.error(`Error: Environment variable ${field} is missing.`);
        }
    });
};

module.exports = loadEnv;
