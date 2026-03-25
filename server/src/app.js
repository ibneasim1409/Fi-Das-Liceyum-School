const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { initCronJobs } = require('./cronJobs');

dotenv.config();

const app = express();

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "http://localhost:5001", "https:"],
        },
    },
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

// Database Connection Check Middleware
app.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: 'Service Unavailable: Database connection is missing. Please start the database.',
            needsSetup: false
        });
    }
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/inquiries', require('./routes/inquiryRoutes'));
app.use('/api/admissions', require('./routes/admissionRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/challans', require('./routes/challanRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/lists', require('./routes/customListRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Fi Das Liceyum School ERP API' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// Start the Enterprise Cron Engine
if (process.env.NODE_ENV !== 'test') {
    initCronJobs();
}

module.exports = app;
