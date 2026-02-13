try {
    const mongoose = require('mongoose');
    console.log('Mongoose found:', mongoose.version);
} catch (e) {
    console.log('Mongoose NOT found');
    console.log('Paths:', module.paths);
}
