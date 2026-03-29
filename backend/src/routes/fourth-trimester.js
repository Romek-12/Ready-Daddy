const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/fourth-trimester - all fourth trimester content
router.get('/', authenticateToken, (req, res) => {
  try {
    const weeks = db.prepare('SELECT * FROM fourth_trimester ORDER BY week_after_birth').all();
    res.json({ weeks });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/fourth-trimester/:week
router.get('/:week', authenticateToken, (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const data = db.prepare('SELECT * FROM fourth_trimester WHERE week_after_birth = ?').get(week);
    if (!data) return res.status(404).json({ error: 'Brak danych dla tego tygodnia' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
