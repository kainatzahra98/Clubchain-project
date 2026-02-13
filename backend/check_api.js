const http = require('http');

http.get('http://localhost:5000/api/clubs', (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const clubs = JSON.parse(data);
            console.log('Total Clubs returned by API:', clubs.length);
            clubs.forEach(c => console.log(`- [${c._id}] ${c.name}`));
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw data:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error connecting to API:', err.message);
});
