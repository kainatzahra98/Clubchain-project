const axios = require('axios');
axios.get('http://192.168.25.32:5000/api/clubs').then(res => {
    console.log("realFeedback of clubs:");
    res.data.forEach(c => {
        console.log(c.name, c.realFeedback);
    });
}).catch(console.error);
