const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testMobileRegistration = async () => {
    console.log('📱 Simulating Mobile App Registration...');
    try {
        const res = await axios.post(`${API_URL}/auth/register`, {
            name: 'Mobile User Test',
            email: `mobile_${Date.now()}@test.com`,
            password: 'password123',
            role: 'CLIENT'
        });

        console.log('✅ Registration Successful!');
        console.log('   User ID:', res.data._id);
        console.log('   Database:', 'clubz (Atlas)');

        console.log('\n🔍 Verifying Visibility for Web Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@hotel.com', // Using standard seeded admin
            password: 'password123'
        });

        const membersRes = await axios.get(`${API_URL}/members`, {
            headers: { Authorization: `Bearer ${loginRes.data.token}` }
        });

        const found = membersRes.data.find(u => u._id === res.data._id);
        if (found) {
            console.log('✅ Sync Confirmed: Web Admin can see the new Mobile User!');
        } else {
            console.log('❌ Sync Failed: User not found in admin list.');
        }

    } catch (err) {
        console.error('❌ Test Failed:', err.response?.data || err.message);
    }
};

testMobileRegistration();
