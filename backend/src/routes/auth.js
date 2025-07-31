const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/config');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const auth = require('../middleware/auth');

// Set up multer storage for avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}${ext}`);
  }
});
const upload = multer({ storage: avatarStorage });

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database error'
                });
            }

            if (user) {
                return res.status(400).json({
                    status: 'error',
                    message: 'User already exists'
                });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            db.run(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({
                            status: 'error',
                            message: 'Error creating user'
                        });
                    }

                    // Generate token
                    const token = jwt.sign(
                        { id: this.lastID, username },
                        config.jwtSecret,
                        { expiresIn: '24h' }
                    );

                    res.status(201).json({
                        status: 'success',
                        data: {
                            token,
                            user: {
                                id: this.lastID,
                                username,
                                email
                            }
                        }
                    });
                }
            );
        });
    } catch (error) {
      console.error('Exception in /register:', error);
      res.status(500).json({
          status: 'error',
          message: 'Server error'
      });
  }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('DB error in /login:', err); // <--- Added logging
                return res.status(500).json({
                    status: 'error',
                    message: 'Database error'
                });
            }

            if (!user) {
                console.warn('Login failed: user not found for email', email); // <--- Added logging
                return res.status(401).json({
                    status: 'error',
                    message: 'Invalid credentials'
                });
            }

            // Check password
            console.log('User found for login:', user.email);
            try {
                const isMatch = await bcrypt.compare(password, user.password);
                console.log('Password comparison result:', isMatch);
                if (!isMatch) {
                    console.warn('Login failed: incorrect password for', user.email);
                    return res.status(401).json({
                        status: 'error',
                        message: 'Invalid credentials'
                    });
                }
            } catch (bcryptError) {
                console.error('Bcrypt error during password comparison:', bcryptError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Password check error'
                });
            }

            // Generate token
            const token = jwt.sign(
                { id: user.id, username: user.username },
                config.jwtSecret,
                { expiresIn: '24h' }
            );

            res.json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                }
            });
        });
    } catch (error) {
      console.error('Exception in /login:', error);
      res.status(500).json({
          status: 'error',
          message: 'Server error'
      });
  }
});

// Get current user profile
router.get('/me', auth, (req, res) => {
  db.get('SELECT id, username, email, phone, address, avatar, weight_kg, role FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error' });
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });
    res.json({ status: 'success', data: user });
  });
});

// Update user profile (username, phone, address, weight_kg, email)
router.put('/me', auth, (req, res) => {
  const { username, phone, address, weight_kg, email } = req.body;
  // Only update fields that are provided
  const updates = [];
  const params = [];
  if (username) { updates.push('username = ?'); params.push(username); }
  if (phone) { updates.push('phone = ?'); params.push(phone); }
  if (address) { updates.push('address = ?'); params.push(address); }
  if (typeof weight_kg !== 'undefined') { updates.push('weight_kg = ?'); params.push(weight_kg); }
  if (email) { updates.push('email = ?'); params.push(email); }
  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No fields to update' });
  }
  params.push(req.user.id);
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', message: 'Profile updated' });
  });
});

// Update user physical info and mark setup as complete
router.put('/me/physical-info', auth, (req, res) => {
  const { age, gender, height_cm, weight_kg } = req.body;
  if (!age || !gender || !height_cm || !weight_kg) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }
  db.run(
    'UPDATE users SET age = ?, gender = ?, height_cm = ?, weight_kg = ?, setup_complete = 1 WHERE id = ?',
    [age, gender, height_cm, weight_kg, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
      res.json({ status: 'success', message: 'Physical info updated' });
    }
  );
});

// Create a new goal for the user
router.post('/goals', auth, (req, res) => {
  const { goal_type, target_value, target_unit, target_date } = req.body;
  if (!goal_type) {
    return res.status(400).json({ status: 'error', message: 'Goal type is required' });
  }
  db.run(
    'INSERT INTO goals (user_id, goal_type, target_value, target_unit, target_date) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, goal_type, target_value, target_unit, target_date],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
      res.json({ status: 'success', message: 'Goal created', goal_id: this.lastID });
    }
  );
});

// Get all goals for the user
router.get('/goals', auth, (req, res) => {
  db.all('SELECT * FROM goals WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// POST /api/auth/avatar - upload profile picture
router.post('/avatar', auth, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  const avatarPath = `/uploads/avatars/${req.file.filename}`;
  db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarPath, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ status: 'error', message: 'Failed to update avatar' });
    }
    res.json({ status: 'success', avatar: avatarPath });
  });
});

module.exports = router; 