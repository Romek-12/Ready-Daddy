const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/shopping - all shopping items
router.get('/', authenticateToken, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM shopping_items ORDER BY trimester, category, is_essential DESC').all();

    // Group by trimester
    const grouped = { 1: [], 2: [], 3: [] };
    items.forEach(item => {
      if (grouped[item.trimester]) {
        grouped[item.trimester].push(item);
      }
    });

    // Calculate total cost
    const totalCost = items.reduce((sum, item) => sum + (item.estimated_cost_pln || 0), 0);

    res.json({ items: grouped, totalCost });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/shopping/trimester/:trimester
router.get('/trimester/:trimester', authenticateToken, (req, res) => {
  try {
    const trimester = parseInt(req.params.trimester);
    if (trimester < 1 || trimester > 3) {
      return res.status(400).json({ error: 'Trymestr musi być 1, 2 lub 3' });
    }

    const items = db.prepare(
      'SELECT * FROM shopping_items WHERE trimester = ? ORDER BY category, is_essential DESC'
    ).all(trimester);

    const totalCost = items.reduce((sum, item) => sum + (item.estimated_cost_pln || 0), 0);
    const essentialCost = items.filter(i => i.is_essential).reduce((sum, item) => sum + (item.estimated_cost_pln || 0), 0);

    res.json({ trimester, items, totalCost, essentialCost });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/shopping/calculator - first year cost calculator
router.get('/calculator', authenticateToken, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM shopping_items ORDER BY trimester').all();

    const essentialItems = items.filter(i => i.is_essential);
    const niceToHaveItems = items.filter(i => !i.is_essential);

    const essentialTotal = essentialItems.reduce((sum, i) => sum + (i.estimated_cost_pln || 0), 0);
    const fullTotal = items.reduce((sum, i) => sum + (i.estimated_cost_pln || 0), 0);

    // Monthly recurring costs estimate
    const monthlyCosts = {
      pieluchy: 200,
      mleko_lub_jedzenie: 150,
      kosmetyki: 80,
      ubranka: 100,
      lekarz: 100
    };
    const monthlyTotal = Object.values(monthlyCosts).reduce((a, b) => a + b, 0);

    res.json({
      oneTimeCosts: {
        essential: essentialTotal,
        full: fullTotal,
        savings: fullTotal - essentialTotal
      },
      monthlyCosts,
      monthlyTotal,
      firstYearEstimate: essentialTotal + (monthlyTotal * 12)
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
