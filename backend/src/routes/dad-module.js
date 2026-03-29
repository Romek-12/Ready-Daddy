const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const content = require('../data/dad-module');

const router = express.Router();

// GET /api/dad-module - full dad module content
router.get('/', authenticateToken, (req, res) => {
  res.json(content);
});

module.exports = router;
