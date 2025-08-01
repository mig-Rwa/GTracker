const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all active membership plans (public endpoint)
router.get('/plans', (req, res) => {
  db.all('SELECT plan_key, label, price, currency, features FROM membership_plans WHERE is_active = 1', [], (err, rows) => {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', data: rows });
  });
});

// Get all memberships (current and past) for the authenticated user
router.get('/', auth, (req, res) => {
  const query = `
    SELECT 
      m.*,
      CASE 
        WHEN m.status = 'active' AND (m.end_date IS NULL OR date(m.end_date) >= date('now')) 
        THEN 1 
        ELSE 0 
      END as is_currently_active,
      CASE 
        WHEN m.status = 'active' AND m.end_date IS NOT NULL AND date(m.end_date) < date('now')
        THEN 'expired'
        ELSE m.status
      END as calculated_status
    FROM memberships m
    WHERE m.user_id = ?
    ORDER BY 
      is_currently_active DESC,
      m.start_date DESC
  `;
  
  db.serialize(() => {
    // First, update any expired memberships
    db.run(
      `UPDATE memberships 
       SET status = 'expired' 
       WHERE user_id = ? AND status = 'active' 
       AND end_date IS NOT NULL AND date(end_date) < date('now')`,
      [req.user.id],
      function(updateErr) {
        if (updateErr) {
          console.error('Error updating expired memberships:', updateErr);
        }
        
        // Then fetch all memberships
        db.all(query, [req.user.id], (err, rows) => {
          if (err) {
            return res.status(500).json({ 
              status: 'error', 
              message: 'DB error', 
              detail: err.message 
            });
          }
          
          // Process memberships to ensure data consistency
          const processedRows = rows.map(membership => ({
            ...membership,
            status: membership.calculated_status || membership.status,
            days_remaining: membership.end_date 
              ? Math.ceil((new Date(membership.end_date) - new Date()) / (1000 * 60 * 60 * 24))
              : null
          }));
          
          // Get current active membership (not expired)
          const currentMembership = processedRows.find(m => 
            m.status === 'active' && 
            (m.end_date === null || new Date(m.end_date) >= new Date())
          );
          
          // Get membership history (all except current)
          const history = processedRows.filter(m => 
            !currentMembership || m.id !== currentMembership.id
          );
          
          res.json({ 
            status: 'success', 
            data: {
              current: currentMembership || null,
              history: history
            } 
          });
        });
      }
    );
  });
});

// Create Stripe Checkout Session for new membership
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
router.post('/', auth, async (req, res) => {
  const { plan_key, skipStripe } = req.body;
  if (!plan_key) {
    return res.status(400).json({ status: 'error', message: 'Missing plan_key' });
  }
  db.get('SELECT * FROM membership_plans WHERE plan_key = ? AND is_active = 1', [plan_key], async (err, plan) => {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    if (!plan) return res.status(404).json({ status: 'error', message: 'Plan not found' });
    
    // Direct insert when skipStripe flag is true (e.g., localhost testing)
    if (skipStripe || process.env.NODE_ENV === 'development') {
      // calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (plan.plan_key === '1week') endDate.setDate(endDate.getDate() + 7);
      else if (plan.plan_key === '2weeks') endDate.setDate(endDate.getDate() + 14);
      else if (plan.plan_key === '1month') endDate.setMonth(endDate.getMonth() + 1);
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];
      db.run(
        `INSERT INTO memberships (user_id, plan_key, start_date, end_date, status, created_at) 
         VALUES (?, ?, ?, ?, 'active', datetime('now'))`,
        [req.user.id, plan.plan_key, startStr, endStr],
        function(insertErr) {
          if (insertErr) {
            return res.status(500).json({ status: 'error', message: 'DB error', detail: insertErr.message });
          }
          res.json({ status: 'success', message: 'Membership activated (dev mode).' });
        }
      );
      return;
    }
    
    // Stripe flow for production
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscriptions?success=true`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscriptions?canceled=true`,
        customer_email: req.user.email,
        metadata: {
          user_id: req.user.id,
          plan_key: plan.plan_key
        },
      });
      res.json({ status: 'success', url: session.url });
    } catch (e) {
      res.status(500).json({ status: 'error', message: 'Stripe error', detail: e.message });
    }
  });
});

// Cancel membership
router.delete('/', auth, (req, res) => {
  db.run('UPDATE memberships SET status = "cancelled" WHERE user_id = ? AND status = "active"', [req.user.id], function(err) {
    if (err) return res.status(500).json({ status: 'error', message: 'DB error', detail: err.message });
    res.json({ status: 'success', message: 'Membership cancelled' });
  });
});

module.exports = router; 