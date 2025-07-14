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

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/food', require('./routes/food'));
app.use('/api/exercises', require('./routes/exercises'));
const healthMetricsRoutes = require('./routes/health-metrics');
app.use('/api/health-metrics', healthMetricsRoutes);
app.use('/api/admin', require('./routes/admin'));

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