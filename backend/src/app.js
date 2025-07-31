const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const path = require('path');

const app = express();


// Database connection
const db = require('./config/database');
app.set('db', db);

// Security middleware
app.use(helmet());
app.use(cors(config.corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
}

// Register /api/payments BEFORE body parsing (for Stripe webhook)
app.use('/api/payments', require('./routes/payments'));

// Body parsing for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register all other API routes AFTER body parsing
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/food', require('./routes/food'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/health-metrics', require('./routes/health-metrics'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/bookings', require('./routes/bookings'));

// Serve uploaded avatars statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Something went wrong!',
        error: config.nodeEnv === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        status: 'error',
        message: 'Route not found' 
    });
});

module.exports = app; 