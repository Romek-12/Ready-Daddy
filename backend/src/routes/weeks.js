const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helper: calculate current week from conception date
function getCurrentWeek(conceptionDate) {
  const conception = new Date(conceptionDate);
  const now = new Date();
  const diffMs = now - conception;
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  // Pregnancy weeks count from last menstrual period = conception + 2 weeks
  return Math.min(Math.max(diffWeeks + 2, 1), 42);
}

// GET /api/weeks/current - get current week based on user's conception date
router.get('/current', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT conception_date FROM users WHERE id = ?').get(req.user.userId);
    if (!user) return res.status(404).json({ error: 'Użytkownik nie znaleziony' });

    const currentWeek = getCurrentWeek(user.conception_date);
    const weekData = db.prepare('SELECT * FROM weeks WHERE week_number = ?').get(currentWeek);
    const actionCards = db.prepare(
      'SELECT * FROM action_cards WHERE week_min <= ? AND week_max >= ?'
    ).all(currentWeek, currentWeek);

    const totalWeeks = 42;
    const progress = Math.round((currentWeek / totalWeeks) * 100);

    res.json({
      currentWeek,
      totalWeeks,
      progress,
      trimester: weekData ? weekData.trimester : (currentWeek <= 13 ? 1 : currentWeek <= 27 ? 2 : 3),
      weekData: weekData || null,
      actionCards
    });
  } catch (err) {
    console.error('Weeks current error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/weeks/all - list all available weeks (summary)
router.get('/all', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT conception_date FROM users WHERE id = ?').get(req.user.userId);
    const currentWeek = user ? getCurrentWeek(user.conception_date) : 1;

    const weeks = db.prepare(
      'SELECT week_number, trimester, fetus_size_comparison FROM weeks ORDER BY week_number'
    ).all();

    // Mark which weeks are unlocked (current and past)
    const result = weeks.map(w => ({
      ...w,
      unlocked: w.week_number <= currentWeek
    }));

    res.json({ currentWeek, weeks: result });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/weeks/:weekNumber - get specific week details
router.get('/:weekNumber', authenticateToken, (req, res) => {
  try {
    const weekNumber = parseInt(req.params.weekNumber);
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 42) {
      return res.status(400).json({ error: 'Numer tygodnia musi być między 1 a 42' });
    }

    // Check if week is unlocked for user
    const user = db.prepare('SELECT conception_date FROM users WHERE id = ?').get(req.user.userId);
    const currentWeek = user ? getCurrentWeek(user.conception_date) : 1;

    if (weekNumber > currentWeek) {
      return res.status(403).json({
        error: 'Ten tydzień nie jest jeszcze odblokowany',
        currentWeek,
        requestedWeek: weekNumber
      });
    }

    const weekData = db.prepare('SELECT * FROM weeks WHERE week_number = ?').get(weekNumber);
    if (!weekData) {
      return res.status(404).json({ error: 'Brak danych dla tego tygodnia' });
    }

    const actionCards = db.prepare(
      'SELECT * FROM action_cards WHERE week_min <= ? AND week_max >= ?'
    ).all(weekNumber, weekNumber);

    const checkups = db.prepare(
      'SELECT * FROM checkups WHERE week_number = ?'
    ).all(weekNumber);

    res.json({
      week: weekData,
      actionCards,
      checkups
    });
  } catch (err) {
    console.error('Week detail error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
