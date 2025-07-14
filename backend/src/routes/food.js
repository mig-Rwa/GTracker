const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');
// Use native fetch if available (Node 18+), otherwise use node-fetch
let fetch;
try {
  fetch = global.fetch || require('node-fetch');
} catch (e) {
  fetch = require('node-fetch');
}

// Add a food entry
router.post('/', auth, (req, res) => {
    const { date, food, calories, protein, carbs, fat, meal_type, portion } = req.body;
    if (!date || !food) {
        return res.status(400).json({ status: 'error', message: 'Date and food name are required' });
    }
    db.run(
        `INSERT INTO food_entries (user_id, date, food, calories, protein, carbs, fat, meal_type, portion)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, date, food, calories, protein, carbs, fat, meal_type, portion],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ status: 'error', message: 'Error adding food entry' });
            }
            res.status(201).json({
                status: 'success',
                data: {
                    id: this.lastID,
                    user_id: req.user.id,
                    date, food, calories, protein, carbs, fat, meal_type, portion
                }
            });
        }
    );
});

// Get all food entries for a user for a specific date
router.get('/', auth, (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ status: 'error', message: 'Date is required' });
    }
    db.all(
        `SELECT * FROM food_entries WHERE user_id = ? AND date = ? ORDER BY id DESC`,
        [req.user.id, date],
        (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ status: 'error', message: 'Error fetching food entries' });
            }
            res.json({ status: 'success', data: rows });
        }
    );
});

// Edit a food entry
router.put('/:id', auth, (req, res) => {
    const { food, calories, protein, carbs, fat, meal_type, portion } = req.body;
    db.run(
        `UPDATE food_entries SET food = ?, calories = ?, protein = ?, carbs = ?, fat = ?, meal_type = ?, portion = ? WHERE id = ? AND user_id = ?`,
        [food, calories, protein, carbs, fat, meal_type, portion, req.params.id, req.user.id],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ status: 'error', message: 'Error updating food entry' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: 'error', message: 'Food entry not found' });
            }
            res.json({ status: 'success', message: 'Food entry updated' });
        }
    );
});

// Delete a food entry
router.delete('/:id', auth, (req, res) => {
    db.run(
        `DELETE FROM food_entries WHERE id = ? AND user_id = ?`,
        [req.params.id, req.user.id],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ status: 'error', message: 'Error deleting food entry' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ status: 'error', message: 'Food entry not found' });
            }
            res.json({ status: 'success', message: 'Food entry deleted' });
        }
    );
});

// Proxy to Spoonacular for recipe suggestions by nutrients
router.get('/recipes', async (req, res) => {
  const { calories, protein, carbs, fat, number = 5 } = req.query;
  // Set reasonable ranges for each macro
  const params = new URLSearchParams({
    minCalories: calories - 100,
    maxCalories: Number(calories) + 100,
    minProtein: protein - 10,
    maxProtein: Number(protein) + 10,
    minCarbs: carbs - 20,
    maxCarbs: Number(carbs) + 20,
    minFat: fat - 5,
    maxFat: Number(fat) + 5,
    number: String(number),
  });
  try {
    const response = await fetch(
      `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/findByNutrients?${params.toString()}`,
      {
        headers: {
          'X-RapidAPI-Key': '59e75cdb1fmshead49eb375543a2p1ec0b5jsneaeeffa9e399',
          'X-RapidAPI-Host': 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
        },
      }
    );
    if (!response.ok) {
      return res.status(response.status).json({ status: 'error', message: 'Failed to fetch recipes from Spoonacular' });
    }
    const data = await response.json();
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message || 'Unknown error' });
  }
});

// Get meals by ingredient from TheMealDB
router.get('/meals', async (req, res) => {
  const { ingredient } = req.query;
  if (!ingredient) return res.status(400).json({ status: 'error', message: 'ingredient is required' });
  try {
    const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data = await response.json();
    res.json({ status: 'success', data: data.meals || [] });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Get total calories consumed for a period (day, week, month)
router.get('/total-calories', (req, res) => {
  const { period = 'day' } = req.query;
  const userId = req.user?.id || 1;
  let dateCondition = '';
  if (period === 'day') {
    dateCondition = `date = date('now', 'localtime')`;
  } else if (period === 'week') {
    dateCondition = `date >= date('now', '-6 days', 'localtime')`;
  } else if (period === 'month') {
    dateCondition = `date >= date('now', 'start of month', 'localtime')`;
  } else {
    return res.status(400).json({ status: 'error', message: 'Invalid period' });
  }
  db.get(
    `SELECT SUM(calories) as total FROM food_entries WHERE user_id = ? AND ${dateCondition}`,
    [userId],
    (err, row) => {
      if (err) return res.status(500).json({ status: 'error', message: 'Error fetching calories' });
      res.json({ status: 'success', total: row.total || 0 });
    }
  );
});

module.exports = router; 