const dotenv = require('dotenv');
const path = require('path');

const loadEnv = () => {
    // Try multiple possible .env file locations
    const envPaths = [
        path.join(__dirname, '../../.env'),
        path.join(__dirname, '../.env'),
        path.join(__dirname, '../../../.env'),
        path.join(process.cwd(), '.env'),
        '.env'
    ];

    let envLoaded = false;
    
    for (const envPath of envPaths) {
        const result = dotenv.config({ path: envPath });
        if (!result.error) {
            console.log(`✅ Environment variables loaded from: ${envPath}`);
            envLoaded = true;
            break;
        }
    }

    if (!envLoaded) {
        console.warn('⚠️  Warning: .env file not found. Using system environment variables.');
    }

    // Critical: Set fallback JWT_SECRET if not found
    if (!process.env.JWT_SECRET) {
        console.warn('⚠️  JWT_SECRET not found in environment variables.');
        console.log('🔧 Setting fallback JWT_SECRET for development...');
        process.env.JWT_SECRET = 'clubchain_super_secret_jwt_key_2024_fallback';
        console.log('✅ Fallback JWT_SECRET set successfully.');
    }

    // Set fallback for other critical variables
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️  MONGODB_URI not found. Please set it manually.');
    }

    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }

    // Verify critical environment variables
    const required = ['JWT_SECRET'];
    required.forEach(field => {
        if (!process.env[field]) {
            console.error(`❌ Error: Critical environment variable ${field} is still missing after fallback.`);
        } else {
            console.log(`✅ Environment variable ${field} is available.`);
        }
    });

    console.log('🔍 Environment Variables Status:');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Available' : '❌ Missing'}`);
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Available' : '❌ Missing'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
};

module.exports = loadEnv;
