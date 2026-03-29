const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Brak tokenu autoryzacji' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const revoked = db.prepare('SELECT id FROM revoked_tokens WHERE token_hash = ?').get(tokenHash);
    if (revoked) {
      return res.status(401).json({ error: 'Token został unieważniony. Zaloguj się ponownie.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token nieprawidłowy lub wygasł' });
  }
}

module.exports = { authenticateToken };
