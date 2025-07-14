const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// POST /api/health-metrics - record or update BMI/body fat %
router.post('/', auth, (req, res) => {
  const { date, bmi, body_fat_percentage } = req.body;
  if (!date || (!bmi && !body_fat_percentage)) {
    return res.status(400).json({ status: 'error', message: 'Date and at least one metric required' });
  }
  db.run(
    `INSERT INTO health_metrics (user_id, date, bmi, body_fat_percentage)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET bmi = excluded.bmi, body_fat_percentage = excluded.body_fat_percentage`,
    [req.user.id, date, bmi, body_fat_percentage],
    function(err) {
      if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
      res.json({ status: 'success' });
    }
  );
});

// GET /api/health-metrics/weekly - get last 7 days of metrics
router.get('/weekly', auth, (req, res) => {
  db.all(
    `SELECT date, bmi, body_fat_percentage FROM health_metrics WHERE user_id = ? AND date >= date('now', '-6 days', 'localtime') ORDER BY date ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
      res.json({ status: 'success', data: rows });
    }
  );
});

module.exports = router; 