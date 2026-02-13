const app = require('./src/app');

// Handle Uncaught Exceptions (e.g. sync errors not in try-catch)
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Address ${PORT} in use, retrying...`);
        setTimeout(() => {
            server.close();
            server.listen(PORT);
        }, 1000);
    }
});

// Handle Unhandled Promise Rejections (e.g. async db connection fail)
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});
