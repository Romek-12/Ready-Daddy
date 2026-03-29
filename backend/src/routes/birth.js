const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/birth/preparation - all birth preparation stages
router.get('/preparation', authenticateToken, (req, res) => {
  try {
    const stages = db.prepare('SELECT * FROM birth_preparation ORDER BY stage').all();
    res.json({ stages });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/birth/preparation/:stage - specific stage
router.get('/preparation/:stage', authenticateToken, (req, res) => {
  try {
    const stage = parseInt(req.params.stage);
    const data = db.prepare('SELECT * FROM birth_preparation WHERE stage = ?').get(stage);
    if (!data) return res.status(404).json({ error: 'Etap nie znaleziony' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/birth/bag-checklist - hospital bag checklist
router.get('/bag-checklist', authenticateToken, (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM bag_checklist ORDER BY category, is_essential DESC').all();

    // Group by category
    const grouped = {};
    items.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    res.json({ categories: grouped, totalItems: items.length });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
