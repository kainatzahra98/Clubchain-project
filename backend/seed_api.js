
async function seed() {
    try {
        const baseUrl = 'http://127.0.0.1:5000/api';

        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'michael@gmail.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Logged in successfully.');

        // 2. Get Clubs to link feedback to
        const clubsRes = await fetch(`${baseUrl}/clubs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const clubs = await clubsRes.json();
        const clubId = clubs[0]._id;

        // 3. Post Feedbacks
        const feedbacks = [
            // Positive & General
            { message: 'The interface is amazing! Love the new dark mode.', rating: 5, type: 'general', sentiment: 'positive' },
            { message: 'Great improvements on the profile page.', rating: 5, type: 'general', sentiment: 'positive' },

            // Negative & Bug (Trigger Alert)
            { message: 'Cannot book a court, keeps crashing on payment.', rating: 1, type: 'bug', sentiment: 'negative' },
            { message: 'Login page is slow and unresponsive.', rating: 2, type: 'bug', sentiment: 'negative' },

            // Neutral & Feature
            { message: 'Please add more yoga classes on weekends.', rating: 4, type: 'feature', sentiment: 'neutral' },
            { message: 'Would like to see a calendar view for events.', rating: 3, type: 'feature', sentiment: 'neutral' },

            // Negative & Complaint
            { message: 'Staff was rude today at the reception.', rating: 1, type: 'complaint', sentiment: 'negative' },

            // Positive & Feature
            { message: 'The new mobile app is fantastic!', rating: 5, type: 'feature', sentiment: 'positive' },

            // More diverse types
            { message: 'Bug: The filter reset button is not working.', rating: 2, type: 'bug', sentiment: 'negative' },
            { message: 'Feature: I want to be able to export my reports to PDF.', rating: 4, type: 'feature', sentiment: 'positive' },
            { message: 'Complaint: The music in the gym is too loud.', rating: 2, type: 'complaint', sentiment: 'negative' },
            { message: 'General: Just wanted to say thanks for the great service.', rating: 5, type: 'general', sentiment: 'positive' }
        ];

        for (const f of feedbacks) {
            const res = await fetch(`${baseUrl}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...f, clubId })
            });
            console.log(`Posted feedback: "${f.message}" - Status: ${res.status}`);
        }

        console.log('API Seeding Complete!');
    } catch (error) {
        console.error('Seeding Error:', error);
    }
}

seed();
