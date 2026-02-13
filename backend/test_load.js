try {
    console.log('Loading Club Model...');
    require('./src/models/Club.model');
    console.log('Club Model Loaded.');

    console.log('Loading Role Middleware...');
    require('./src/middlewares/role.middleware');
    console.log('Role Middleware Loaded.');

    console.log('Loading Club Controller...');
    require('./src/controllers/club.controller');
    console.log('Club Controller Loaded.');

    console.log('Loading Club Routes...');
    require('./src/routes/clubs.routes');
    console.log('Club Routes Loaded.');

    console.log('SUCCESS: All backend modules loaded without crash.');
} catch (error) {
    console.error('CRASH DETECTED:', error);
    process.exit(1);
}
