const app = require('./app');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const whatsappService = require('./services/whatsappService');

dotenv.config();

const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5174',
        methods: ['GET', 'POST']
    }
});

// Make io accessible to routers
app.set('socketio', io);

io.on('connection', (socket) => {
    console.log('A client connected to Socket.io:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// --- Graceful Shutdown ---
// Only closing HTTP server now. No headless browsers to destroy.
const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Closing HTTP server...`);

    server.close(() => {
        console.log('[Server] HTTP server closed. Exiting cleanly.');

        if (signal === 'SIGUSR2') {
            // nodemon uses SIGUSR2
            process.kill(process.pid, 'SIGUSR2');
        } else {
            process.exit(0);
        }
    });

    // Force-exit after 10 s if graceful shutdown hangs
    setTimeout(() => {
        console.error('[Server] Graceful shutdown timed out. Force exiting.');
        process.exit(1);
    }, 10000);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

// --- EADDRINUSE: bounded retry (max 3 attempts, port killed each time) ---
// This prevents the infinite retry loop that occurs when an old server process
// is still holding the port. After 3 failed attempts we exit so nodemon can
// intervene rather than spinning forever.
let bindAttempts = 0;
server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
        bindAttempts++;
        if (bindAttempts > 3) {
            console.error(`[Server] Port ${PORT} still in use after ${bindAttempts - 1} retries. Exiting so nodemon can restart cleanly.`);
            process.exit(1);
        }
        const delay = bindAttempts * 1500; // 1.5s, 3s, 4.5s
        console.error(`[Server] Port ${PORT} in use (attempt ${bindAttempts}/3). Retrying in ${delay / 1000}s...`);
        // Force-kill whatever is on the port before retrying
        try {
            const { execSync } = require('child_process');
            execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`);
        } catch (_) { }
        setTimeout(() => { server.listen(PORT); }, delay);
    } else {
        console.error('[Server] Unhandled server error:', err);
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
