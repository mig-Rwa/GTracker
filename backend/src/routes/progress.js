const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all progress entries for a user
router.get('/', auth, (req, res) => {
    db.all(
        `SELECT p.*, w.name as workout_name 
         FROM progress p 
         JOIN workouts w ON p.workout_id = w.id 
         WHERE p.user_id = ? 
         ORDER BY p.date DESC`,
        [req.user.id],
        (err, progress) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Error fetching progress'
                });
            }
            res.json({
                status: 'success',
                data: progress
            });
        }
    );
});

// Get progress for a specific workout
router.get('/workout/:workoutId', auth, (req, res) => {
    db.all(
        `SELECT p.*, w.name as workout_name 
         FROM progress p 
         JOIN workouts w ON p.workout_id = w.id 
         WHERE p.user_id = ? AND p.workout_id = ? 
         ORDER BY p.date DESC`,
        [req.user.id, req.params.workoutId],
        (err, progress) => {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Error fetching progress'
                });
            }
            res.json({
                status: 'success',
                data: progress
            });
        }
    );
});

// Create a new progress entry
router.post('/', auth, (req, res) => {
    const { workout_id, notes, type = 'workout', data = null } = req.body;

    if (!workout_id) {
        return res.status(400).json({
            status: 'error',
            message: 'Workout ID is required'
        });
    }

    // Verify workout belongs to user
    db.get('SELECT id FROM workouts WHERE id = ? AND user_id = ?', [workout_id, req.user.id], (err, workout) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Error verifying workout'
            });
        }
        if (!workout) {
            return res.status(404).json({
                status: 'error',
                message: 'Workout not found'
            });
        }

        // Create progress entry
        db.run(
            'INSERT INTO progress (user_id, workout_id, notes, type, data) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, workout_id, notes, type, data ? JSON.stringify(data) : null],
            function(err) {
                if (err) {
                    return res.status(500).json({
                        status: 'error',
                        message: 'Error creating progress entry'
                    });
                }
                res.status(201).json({
                    status: 'success',
                    data: {
                        id: this.lastID,
                        user_id: req.user.id,
                        workout_id,
                        notes,
                        type,
                        data,
                        date: new Date().toISOString()
                    }
                });
            }
        );
    });
});

// Update a progress entry
router.put('/:id', auth, (req, res) => {
    const { notes, type, data } = req.body;
    db.run(
        'UPDATE progress SET notes = ?, type = ?, data = ? WHERE id = ? AND user_id = ?',
        [notes, type || 'workout', data ? JSON.stringify(data) : null, req.params.id, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Error updating progress'
                });
            }
            if (this.changes === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Progress entry not found'
                });
            }
            res.json({
                status: 'success',
                message: 'Progress updated successfully'
            });
        }
    );
});

// Delete a progress entry
router.delete('/:id', auth, (req, res) => {
    db.run('DELETE FROM progress WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Error deleting progress entry'
            });
        }
        if (this.changes === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Progress entry not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Progress entry deleted successfully'
        });
    });
});

// Daily check-in: Save a progress entry
router.post('/checkin', auth, (req, res) => {
    const { date, calories, workout, weekly_goal, active_day, notes } = req.body;
    const userId = req.user.id;
    if (!date) {
        return res.status(400).json({ status: 'error', message: 'Date is required' });
    }
    // Prevent duplicate check-in for the same user and date
    db.get('SELECT id FROM progress_entries WHERE user_id = ? AND date = ?', [userId, date], (err, row) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error checking for duplicate' });
        if (row) return res.status(409).json({ status: 'error', message: 'Check-in already exists for this date' });
        db.run(
            `INSERT INTO progress_entries (user_id, date, calories, workout, weekly_goal, active_day, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, date, calories, workout, weekly_goal, active_day, notes],
            function(err) {
                if (err) return res.status(500).json({ status: 'error', message: 'Error saving check-in' });
                res.status(201).json({ status: 'success', data: { id: this.lastID, user_id: userId, date, calories, workout, weekly_goal, active_day, notes } });
            }
        );
    });
});

// Daily check-in: Get progress entries for a user (optionally by date range)
router.get('/checkin', auth, (req, res) => {
    const { start, end } = req.query;
    const userId = req.user.id;
    let query = 'SELECT * FROM progress_entries WHERE user_id = ?';
    const params = [userId];
    if (start && end) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(start, end);
    }
    query += ' ORDER BY date DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ status: 'error', message: 'Error fetching check-ins' });
        res.json({ status: 'success', data: rows });
    });
});

// Get weekly goal progress (percentage of days with weekly_goal = 'yes' in the current week)
router.get('/weekly-goal', auth, (req, res) => {
  const userId = req.user.id;
  db.get(
    `SELECT COUNT(*) as total, SUM(CASE WHEN weekly_goal = 'yes' THEN 1 ELSE 0 END) as met
     FROM progress_entries WHERE user_id = ? AND date >= date('now', '-6 days', 'localtime')`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching weekly goal' });
      const percent = row.total ? Math.round((row.met / row.total) * 100) : 0;
      res.json({ status: 'success', percent });
    }
  );
});

// Get count of active days for a period (week, month)
router.get('/active-days', auth, (req, res) => {
  const { period = 'week' } = req.query;
  const userId = req.user.id;
  let dateCondition = '';
  if (period === 'week') {
    dateCondition = `date >= date('now', '-6 days', 'localtime')`;
  } else if (period === 'month') {
    dateCondition = `date >= date('now', 'start of month', 'localtime')`;
  } else {
    return res.status(400).json({ status: 'error', message: 'Invalid period' });
  }
  db.get(
    `SELECT COUNT(*) as count FROM progress_entries WHERE user_id = ? AND ${dateCondition} AND active_day = 'yes'`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching active days' });
      res.json({ status: 'success', count: row.count || 0 });
    }
  );
});

// Get calories lost over time (per day, week, or month)
router.get('/calories-burned', auth, (req, res) => {
  const { period = 'day' } = req.query;
  const userId = req.user.id;

  let groupBy, dateCondition, labelFormat;
  if (period === 'day') {
    groupBy = "date";
    dateCondition = "date >= date('now', '-29 days', 'localtime')";
    labelFormat = "date";
  } else if (period === 'week') {
    groupBy = "strftime('%Y-%W', date)";
    dateCondition = "date >= date('now', '-83 days', 'localtime')";
    labelFormat = "strftime('%Y-%W', date)";
  } else if (period === 'month') {
    groupBy = "strftime('%Y-%m', date)";
    dateCondition = "date >= date('now', '-11 months', 'localtime')";
    labelFormat = "strftime('%Y-%m', date)";
  } else {
    return res.status(400).json({ status: 'error', message: 'Invalid period' });
  }

  db.all(
    `SELECT ${labelFormat} as label, SUM(calories) as calories
     FROM progress_entries
     WHERE user_id = ? AND ${dateCondition}
     GROUP BY ${groupBy}
     ORDER BY label ASC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching calories lost' });
      res.json({ status: 'success', data: rows });
    }
  );
});

// Get workout type distribution for the last 30 days
router.get('/workout-types', auth, (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT workout, COUNT(*) as count FROM progress_entries WHERE user_id = ? AND date >= date('now', '-29 days', 'localtime') GROUP BY workout`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching workout types' });
      res.json({ status: 'success', data: rows });
    }
  );
});

// Calculate and record calories burned for a day
router.post('/record-calories', auth, (req, res) => {
  const { exercises, weight_kg, date, workout_id } = req.body;
  if (!exercises || !weight_kg || !workout_id) {
    return res.status(400).json({ status: 'error', message: 'Missing data' });
  }
  let totalCalories = 0;
  exercises.forEach(ex => {
    totalCalories += ex.met * weight_kg * (ex.duration_minutes / 60);
  });
  const entryDate = date || new Date().toISOString().slice(0, 10);
  db.run(
    `INSERT INTO progress_entries (user_id, workout_id, date, calories)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, workout_id, date) DO UPDATE SET calories = excluded.calories`,
    [req.user.id, workout_id, entryDate, totalCalories],
    function(err) {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
      }
      res.json({ status: 'success', total_calories_burned: totalCalories, date: entryDate });
    }
  );
});

module.exports = router; 