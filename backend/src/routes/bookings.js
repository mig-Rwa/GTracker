const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all bookings for current user
router.get('/', auth, (req, res) => {
  db.all('SELECT * FROM bookings WHERE user_id = ? ORDER BY booking_date DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Create a new booking
router.post('/', auth, (req, res) => {
  const { facility, hours, booking_date } = req.body;
  if (!facility || !hours || !booking_date) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }
  db.run('INSERT INTO bookings (user_id, facility, hours, booking_date) VALUES (?, ?, ?, ?)', [req.user.id, facility, hours, booking_date], function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    db.get('SELECT * FROM bookings WHERE id = ?', [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ status: 'error', message: 'DB error', detail: err2.message });
      res.json({ status: 'success', data: row });
    });
  });
});

// Update a booking
router.put('/:id', auth, (req, res) => {
  const { facility, hours, booking_date } = req.body;
  db.run('UPDATE bookings SET facility = ?, hours = ?, booking_date = ? WHERE id = ? AND user_id = ?', [facility, hours, booking_date, req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    if (this.changes === 0) return res.status(404).json({ status: 'error', message: 'Booking not found' });
    db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id], (err2, row) => {
      if (err2) return res.status(500).json({ status: 'error', message: 'DB error', detail: err2.message });
      res.json({ status: 'success', data: row });
    });
  });
});

// Delete a booking
router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM bookings WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    if (this.changes === 0) return res.status(404).json({ status: 'error', message: 'Booking not found' });
    res.json({ status: 'success', message: 'Booking deleted' });
  });
});

module.exports = router; 