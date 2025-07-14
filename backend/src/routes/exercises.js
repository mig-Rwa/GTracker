const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Add an exercise to a workout
router.post('/:workoutId/exercises', auth, (req, res) => {
    const { name, sets, reps, weight, rest, notes } = req.body;
    const workoutId = req.params.workoutId;

    if (!name) {
        return res.status(400).json({ status: 'error', message: 'Exercise name is required' });
    }

    db.run(
        'INSERT INTO exercises (workout_id, name, sets, reps, weight, rest, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [workoutId, name, sets, reps, weight, rest, notes],
        function(err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Error adding exercise' });
            }
            res.status(201).json({
                status: 'success',
                data: {
                    id: this.lastID,
                    workout_id: workoutId,
                    name, sets, reps, weight, rest, notes
                }
            });
        }
    );
});

// Edit an exercise
router.put('/exercise/:id', auth, (req, res) => {
    const { name, sets, reps, weight, rest, notes } = req.body;
    db.run(
        'UPDATE exercises SET name = ?, sets = ?, reps = ?, weight = ?, rest = ?, notes = ? WHERE id = ?',
        [name, sets, reps, weight, rest, notes, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Error updating exercise' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: 'error', message: 'Exercise not found' });
            }
            res.json({ status: 'success', message: 'Exercise updated' });
        }
    );
});

// Delete an exercise
router.delete('/exercise/:id', auth, (req, res) => {
    db.run('DELETE FROM exercises WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Error deleting exercise' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ status: 'error', message: 'Exercise not found' });
        }
        res.json({ status: 'success', message: 'Exercise deleted' });
    });
});

// Get all library exercises (optionally filtered)
router.get('/', (req, res) => {
    const { muscle_group, difficulty, search } = req.query;
    let query = 'SELECT * FROM exercises WHERE workout_id IS NULL';
    let params = [];
    if (muscle_group) {
        query += ' AND muscle_group = ?';
        params.push(muscle_group);
    }
    if (difficulty) {
        query += ' AND difficulty = ?';
        params.push(difficulty);
    }
    if (search) {
        query += ' AND name LIKE ?';
        params.push(`%${search}%`);
    }
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'Error fetching exercises' });
        }
        res.json({ status: 'success', data: rows });
    });
});

// Get recent exercises for a user with pagination
router.get('/recent', auth, (req, res) => {
  let { limit = 5, offset = 0 } = req.query;
  limit = parseInt(limit, 10);
  offset = parseInt(offset, 10);
  const userId = req.user.id;
  db.get(
    `SELECT COUNT(*) as total FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?)`,
    [userId],
    (err, countRow) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching exercise count' });
      db.all(
        `SELECT * FROM exercises WHERE workout_id IN (SELECT id FROM workouts WHERE user_id = ?) ORDER BY id DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) return res.status(500).json({ status: 'error', message: 'Error fetching recent exercises' });
          res.json({ status: 'success', data: rows, total: countRow.total });
        }
      );
    }
  );
});

module.exports = router; 