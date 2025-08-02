const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Helper to calculate MET for an exercise name
const METS = {
  "Running": 8,
  "Push-ups": 3.8,
  "Cycling": 7.5,
  "Squats": 5,
  "Pull-ups": 8,
  "Bench Press": 6,
  "Deadlift": 6,
  "Jump Rope": 12.3,
  // Add more as needed
};
function getMetForExercise(name) {
  return METS[name] || 4;
}

async function recordCaloriesForWorkout(userId, workoutId, date) {
  // Fetch user weight
  let weight_kg = 70;
  await new Promise((resolve) => {
    db.get('SELECT weight_kg FROM users WHERE id = ?', [userId], (err, row) => {
      if (!err && row && row.weight_kg) weight_kg = row.weight_kg;
      resolve();
    });
  });
  // Fetch exercises for this workout
  const exercises = await new Promise((resolve) => {
    db.all('SELECT name FROM exercises WHERE workout_id = ?', [workoutId], (err, rows) => {
      resolve(rows || []);
    });
  });
  // Assume 30 min per exercise for now
  let totalCalories = 0;
  exercises.forEach(ex => {
    totalCalories += getMetForExercise(ex.name) * weight_kg * (30 / 60);
  });
  // Insert or update progress_entries
  await new Promise((resolve) => {
    db.run(
      `INSERT INTO progress_entries (user_id, workout_id, date, calories)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, workout_id, date) DO UPDATE SET calories = excluded.calories`,
      [userId, workoutId, date, totalCalories],
      () => resolve()
    );
  });
}

// Get all workouts for a user (with exercises)
router.get('/', auth, (req, res) => {
    db.all('SELECT * FROM workouts WHERE user_id = ?', [req.user.id], (err, workouts) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Error fetching workouts'
            });
        }
        const workoutIds = workouts.map(w => w.id);
        if (workoutIds.length === 0) {
            return res.json({ status: 'success', data: [] });
        }
        db.all(
            `SELECT * FROM exercises WHERE workout_id IN (${workoutIds.map(() => '?').join(',')})`,
            workoutIds,
            (err2, exercises) => {
                if (err2) {
                    return res.status(500).json({ status: 'error', message: 'Error fetching exercises' });
                }
                const workoutsWithExercises = workouts.map(w => ({
                    ...w,
                    exercises: exercises.filter(e => e.workout_id === w.id)
                }));
                res.json({ status: 'success', data: workoutsWithExercises });
            }
        );
    });
});

// Get a single workout (with exercises)
router.get('/:id', auth, (req, res) => {
    db.get('SELECT * FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, workout) => {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Error fetching workout'
            });
        }
        if (!workout) {
            return res.status(404).json({
                status: 'error',
                message: 'Workout not found'
            });
        }
        db.all('SELECT * FROM exercises WHERE workout_id = ?', [workout.id], (err2, exercises) => {
            if (err2) {
                return res.status(500).json({ status: 'error', message: 'Error fetching exercises' });
            }
            res.json({ status: 'success', data: { ...workout, exercises } });
        });
    });
});

// Create a new workout
router.post('/', auth, async (req, res) => {
    const { name, description, date } = req.body; // Accept date from body

    if (!name) {
        return res.status(400).json({
            status: 'error',
            message: 'Workout name is required'
        });
    }

    // Use provided date or default to today (YYYY-MM-DD)
    const dateValue = date || new Date().toISOString().slice(0, 10);

    db.run(
        'INSERT INTO workouts (user_id, name, description, date) VALUES (?, ?, ?, ?)',
        [req.user.id, name, description, dateValue],
        async function(err) {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error creating workout'
                });
            }
            // Automatically record calories (in case exercises are added immediately after, this will be updated again)
            await recordCaloriesForWorkout(req.user.id, this.lastID, dateValue);
            res.status(201).json({
                status: 'success',
                data: {
                    id: this.lastID,
                    user_id: req.user.id,
                    name,
                    description,
                    date: dateValue
                }
            });
        }
    );
});

// Update a workout and its exercises
router.put('/:id', auth, async (req, res) => {
    const { name, description, exercises } = req.body;
    const workoutId = req.params.id;

    if (!name) {
        return res.status(400).json({
            status: 'error',
            message: 'Workout name is required'
        });
    }

    db.run(
        'UPDATE workouts SET name = ?, description = ? WHERE id = ? AND user_id = ?',
        [name, description, workoutId, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Error updating workout'
                });
            }
            if (this.changes === 0) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Workout not found'
                });
            }

            // If exercises array is provided, update exercises for this workout
            if (Array.isArray(exercises)) {
                // Remove all old exercises for this workout
                db.run('DELETE FROM exercises WHERE workout_id = ?', [workoutId], function(delErr) {
                    if (delErr) {
                        return res.status(500).json({ status: 'error', message: 'Error deleting old exercises' });
                    }
                    // Insert new exercises
                    if (exercises.length === 0) {
                        // No new exercises, record calories as 0
                        recordCaloriesForWorkout(req.user.id, workoutId, new Date().toISOString().slice(0, 10));
                        return res.json({
                            status: 'success',
                            data: {
                                id: workoutId,
                                user_id: req.user.id,
                                name,
                                description,
                                exercises: []
                            }
                        });
                    }
                    const placeholders = exercises.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
                    const values = [];
                    exercises.forEach(ex => {
                        values.push(
                            workoutId,
                            ex.name || '',
                            ex.bodyPart || '',
                            ex.equipment || '',
                            ex.target || '',
                            ex.gifUrl || ''
                        );
                    });
                    db.run(
                        `INSERT INTO exercises (workout_id, name, bodyPart, equipment, target, gifUrl) VALUES ${placeholders}`,
                        values,
                        async function(insErr) {
                            if (insErr) {
                                return res.status(500).json({ status: 'error', message: 'Error inserting exercises' });
                            }
                            // After updating exercises, record calories
                            await recordCaloriesForWorkout(req.user.id, workoutId, new Date().toISOString().slice(0, 10));
                            // Return updated workout with exercises
                            db.all('SELECT * FROM exercises WHERE workout_id = ?', [workoutId], function(fetchErr, newExercises) {
                                if (fetchErr) {
                                    return res.status(500).json({ status: 'error', message: 'Error fetching exercises' });
                                }
                                res.json({
                                    status: 'success',
                                    data: {
                                        id: workoutId,
                                        user_id: req.user.id,
                                        name,
                                        description,
                                        exercises: newExercises
                                    }
                                });
                            });
                        }
                    );
                });
            } else {
                // No exercises update, just record calories
                recordCaloriesForWorkout(req.user.id, workoutId, new Date().toISOString().slice(0, 10));
                db.all('SELECT * FROM exercises WHERE workout_id = ?', [workoutId], function(fetchErr, currentExercises) {
                    if (fetchErr) {
                        return res.status(500).json({ status: 'error', message: 'Error fetching exercises' });
                    }
                    res.json({
                        status: 'success',
                        data: {
                            id: workoutId,
                            user_id: req.user.id,
                            name,
                            description,
                            exercises: currentExercises
                        }
                    });
                });
            }
        }
    );
});

// Delete a workout
router.delete('/:id', auth, (req, res) => {
    db.run('DELETE FROM workouts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
        if (err) {
            return res.status(500).json({
                status: 'error',
                message: 'Error deleting workout'
            });
        }
        if (this.changes === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Workout not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Workout deleted successfully'
        });
    });
});

// Get count of completed workouts for a period (day, week, month, year) - only workouts with at least one exercise
router.get('/completed', auth, (req, res) => {
  const { period = 'day' } = req.query;
  const userId = req.user.id;
  let dateCondition = '';
  if (period === 'day') {
    dateCondition = `w.date = date('now', 'localtime')`;
  } else if (period === 'week') {
    dateCondition = `w.date >= date('now', '-6 days', 'localtime')`;
  } else if (period === 'month') {
    dateCondition = `w.date >= date('now', 'start of month', 'localtime')`;
  } else if (period === 'year') {
    dateCondition = `w.date >= date('now', 'start of year', 'localtime')`;
  } else {
    return res.status(400).json({ status: 'error', message: 'Invalid period' });
  }

  db.get(
    `SELECT COUNT(DISTINCT w.id) as count
     FROM workouts w
     JOIN exercises e ON w.id = e.workout_id
     WHERE w.user_id = ? AND ${dateCondition}`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching workouts completed' });
      res.json({ status: 'success', count: row.count || 0 });
    }
  );
});

// Get recent workouts for a user with pagination
router.get('/recent', auth, (req, res) => {
  let { limit = 5, offset = 0 } = req.query;
  limit = parseInt(limit, 10);
  offset = parseInt(offset, 10);
  const userId = req.user.id;
  db.get(
    `SELECT COUNT(*) as total FROM workouts WHERE user_id = ?`,
    [userId],
    (err, countRow) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching workout count' });
      db.all(
        `SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) return res.status(500).json({ status: 'error', message: 'Error fetching recent workouts' });
          res.json({ status: 'success', data: rows, total: countRow.total });
        }
      );
    }
  );
});

module.exports = router; 