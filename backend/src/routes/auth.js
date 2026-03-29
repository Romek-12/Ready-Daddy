const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const router = express.Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, conceptionDate, partnerName } = req.body;

    if (!email || !password || !conceptionDate) {
      return res.status(400).json({ error: 'Email, hasło i data poczęcia są wymagane' });
    }

    // Server-side email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Nieprawidłowy format adresu email' });
    }

    // Server-side password validation
    if (password.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Hasło jest zbyt długie (max 128 znaków)' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(conceptionDate) || isNaN(Date.parse(conceptionDate))) {
      return res.status(400).json({ error: 'Nieprawidłowy format daty poczęcia (wymagany: YYYY-MM-DD)' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Użytkownik z tym adresem email już istnieje' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const stmt = db.prepare(
      'INSERT INTO users (email, password_hash, conception_date, partner_name) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(email, passwordHash, conceptionDate, partnerName || '');

    // Generate token
    const token = jwt.sign(
      { userId: result.lastInsertRowid, email, jti: crypto.randomBytes(8).toString('hex') },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Konto utworzone pomyślnie',
      token,
      user: {
        id: result.lastInsertRowid,
        email,
        conceptionDate,
        partnerName: partnerName || ''
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email i hasło są wymagane' });
    }

    // Server-side email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Nieprawidłowy format adresu email' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Nieprawidłowy email lub hasło' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, jti: crypto.randomBytes(8).toString('hex') },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        conceptionDate: user.conception_date,
        partnerName: user.partner_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, conception_date, partner_name, created_at FROM users WHERE id = ?').get(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    res.json({
      id: user.id,
      email: user.email,
      conceptionDate: user.conception_date,
      partnerName: user.partner_name,
      createdAt: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// PUT /api/auth/me - update user profile
router.put('/me', authenticateToken, (req, res) => {
  try {
    const { conceptionDate, partnerName } = req.body;
    const updates = [];
    const values = [];

    if (conceptionDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(conceptionDate) || isNaN(Date.parse(conceptionDate))) {
        return res.status(400).json({ error: 'Nieprawidłowy format daty poczęcia (wymagany: YYYY-MM-DD)' });
      }
      updates.push('conception_date = ?');
      values.push(conceptionDate);
    }
    if (partnerName !== undefined) {
      updates.push('partner_name = ?');
      values.push(partnerName);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Brak danych do aktualizacji' });
    }

    values.push(req.user.userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Profil zaktualizowany' });
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const tokenHash = hashToken(token);
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare('INSERT OR IGNORE INTO revoked_tokens (token_hash, expires_at) VALUES (?, ?)').run(tokenHash, expiresAt);
      // Clean expired entries
      db.prepare("DELETE FROM revoked_tokens WHERE expires_at < datetime('now')").run();
    }
    res.json({ message: 'Wylogowano pomyślnie' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/auth/forgot-password
// NOTE: Without a mailer, the token is returned in the response body.
// Replace res.json({ resetToken }) with your email-sending logic in production.
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Podaj adres email' });

    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    // Always return success to avoid user enumeration
    if (!user) {
      return res.json({ message: 'Jeśli konto istnieje, kod resetowania został przygotowany.' });
    }

    // Invalidate old tokens for this user
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?').run(user.id);

    // Generate a token (32 random bytes → hex string)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
    ).run(user.id, tokenHash, expiresAt);

    // In production: send email with rawToken. For now, return it directly.
    res.json({
      message: 'Kod resetowania został wygenerowany.',
      resetToken: rawToken, // Remove this line and replace with email sending in production
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token i nowe hasło są wymagane' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Hasło musi mieć co najmniej 6 znaków' });
    }
    if (newPassword.length > 128) {
      return res.status(400).json({ error: 'Hasło jest zbyt długie (max 128 znaków)' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = db.prepare(
      "SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')"
    ).get(tokenHash);

    if (!record) {
      return res.status(400).json({ error: 'Kod resetowania jest nieprawidłowy lub wygasł' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, record.user_id);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

    res.json({ message: 'Hasło zostało zmienione. Możesz teraz się zalogować.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

module.exports = router;
