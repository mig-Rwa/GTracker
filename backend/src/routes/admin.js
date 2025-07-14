const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Admin check middleware
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ status: 'error', message: 'Admin access required' });
}

// List all users
router.get('/users', auth, isAdmin, (req, res) => {
  db.all('SELECT id, username, email, role, age, gender, height_cm, weight_kg, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Create a new user
router.post('/users', auth, isAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }
  db.run(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, password, role || 'user'],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
      res.json({ status: 'success', user_id: this.lastID });
    }
  );
});

// Update a user (info/role)
router.put('/users/:id', auth, isAdmin, (req, res) => {
  const { username, email, role, age, gender, height_cm, weight_kg } = req.body;
  const updates = [];
  const params = [];
  if (username) { updates.push('username = ?'); params.push(username); }
  if (email) { updates.push('email = ?'); params.push(email); }
  if (role) { updates.push('role = ?'); params.push(role); }
  if (age) { updates.push('age = ?'); params.push(age); }
  if (gender) { updates.push('gender = ?'); params.push(gender); }
  if (height_cm) { updates.push('height_cm = ?'); params.push(height_cm); }
  if (weight_kg) { updates.push('weight_kg = ?'); params.push(weight_kg); }
  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No fields to update' });
  }
  params.push(req.params.id);
  db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params, function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', message: 'User updated' });
  });
});

// Delete a user
router.delete('/users/:id', auth, isAdmin, (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }
    res.json({ status: 'success', message: 'User deleted' });
  });
});

module.exports = router; 