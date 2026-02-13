const { sendSupportEmail } = require('./src/services/email.service');
const dotenv = require('dotenv');
dotenv.config();

async function testSupportEmail() {
    console.log('Testing support email with current .env config...');
    try {
        await sendSupportEmail('user@example.com', 'Test support message from Antigravity.');
        console.log('✅ Support email test successful (check console logs if in dev mode)');
    } catch (err) {
        console.error('❌ Support email test failed:', err.message);
    }
}

testSupportEmail();
