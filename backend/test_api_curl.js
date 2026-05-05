const jwt = require('jsonwebtoken');
require('dotenv').config();

const test = async () => {
    try {
        const token = jwt.sign({ id: '697a062f091ede937cb7a490', role: 'CLIENT' }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log("Generated Token:", token);
        
        const axios = require('axios');
        const res = await axios.get('http://localhost:5000/api/feedback/rankings', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Rankings response:", JSON.stringify(res.data, null, 2));
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
};
test();
