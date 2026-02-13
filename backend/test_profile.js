const API_URL = 'http://localhost:5000/api/auth';
let token = '';

async function login() {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'client@example.com',
                password: 'password123'
            })
        });
        const data = await response.json();
        if (response.ok) {
            token = data.token;
            console.log('Login successful, token obtained.');
            return token;
        } else {
            console.error('Login failed:', data);
            return null;
        }
    } catch (err) {
        console.error('Login error:', err);
    }
}

async function getProfile() {
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('GET /me Response:', response.status, data);
    } catch (err) {
        console.error('GET /me error:', err);
    }
}

async function run() {
    await login();
    await getProfile();
}

run();
