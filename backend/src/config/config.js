require('dotenv').config();

module.exports = {
    port: process.env.PORT || 4100,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
    dbPath: process.env.DB_PATH || './fitness.db',
    corsOptions: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
    }
}; 