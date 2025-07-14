const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();
        const decoded = jwt.verify(token, config.jwtSecret);
        // Fetch user from DB to get latest role
        db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (err || !user) {
                return res.status(401).json({ status: 'error', message: 'Please authenticate' });
            }
            req.user = user; // This now includes role
            next();
        });
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Please authenticate'
        });
    }
};

module.exports = auth; 