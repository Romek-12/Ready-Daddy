const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/checkups/visits - structured visits with categories and items
router.get('/visits', authenticateToken, (req, res) => {
  try {
    const visits = db.prepare(
      'SELECT * FROM checkup_visits ORDER BY sort_order'
    ).all();

    const categories = db.prepare(
      'SELECT * FROM checkup_categories ORDER BY visit_id, sort_order'
    ).all();

    const items = db.prepare(
      'SELECT * FROM checkup_items ORDER BY category_id, sort_order'
    ).all();

    // Build lookup maps for O(n) assembly
    const itemsByCategory = {};
    for (const item of items) {
      if (!itemsByCategory[item.category_id]) itemsByCategory[item.category_id] = [];
      itemsByCategory[item.category_id].push({
        id: item.id,
        name: item.name,
        optional: item.optional === 1,
        note: item.note || null,
      });
    }

    const categoriesByVisit = {};
    for (const cat of categories) {
      if (!categoriesByVisit[cat.visit_id]) categoriesByVisit[cat.visit_id] = [];
      categoriesByVisit[cat.visit_id].push({
        id: cat.id,
        title: cat.title,
        icon: cat.icon,
        colorKey: cat.color_key,
        singleCheck: cat.single_check === 1,
        items: itemsByCategory[cat.id] || [],
      });
    }

    const result = visits.map(v => ({
      id: v.id,
      weekRange: v.week_range,
      title: v.title,
      subtitle: v.subtitle,
      colorKey: v.color_key,
      categories: categoriesByVisit[v.id] || [],
    }));

    res.json({ visits: result });
  } catch (err) {
    console.error('checkups/visits error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/checkups - all checkups (legacy)
router.get('/', authenticateToken, (req, res) => {
  try {
    const checkups = db.prepare('SELECT * FROM checkups ORDER BY week_number').all();
    res.json({ checkups });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/checkups/trimester/:trimester (legacy)
router.get('/trimester/:trimester', authenticateToken, (req, res) => {
  try {
    const trimester = parseInt(req.params.trimester);
    let weekMin, weekMax;
    if (trimester === 1) { weekMin = 1; weekMax = 13; }
    else if (trimester === 2) { weekMin = 14; weekMax = 27; }
    else if (trimester === 3) { weekMin = 28; weekMax = 42; }
    else return res.status(400).json({ error: 'Trymestr musi być 1, 2 lub 3' });

    const checkups = db.prepare(
      'SELECT * FROM checkups WHERE week_number >= ? AND week_number <= ? ORDER BY week_number'
    ).all(weekMin, weekMax);
    res.json({ trimester, checkups });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/checkups/week/:weekNumber (legacy)
router.get('/week/:weekNumber', authenticateToken, (req, res) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber);
    const checkups = db.prepare('SELECT * FROM checkups WHERE week_number = ?').all(weekNumber);
    res.json({ weekNumber, checkups });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
