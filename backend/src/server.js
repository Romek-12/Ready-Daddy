const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration - restrict to allowed origins
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8081,http://192.168.0.36:8081,exp://192.168.0.36:8081').split(',').map(origin => origin.trim());
const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  maxAge: 600
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100kb' }));

// Global rate limiter - all endpoints
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Zbyt wiele żądań, spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate limiting - auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Zbyt wiele prób logowania, spróbuj ponownie za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Cache-Control for static content (weeks, checkups, shopping, birth, action-cards are read-only)
const staticCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
};

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/weeks', staticCache, require('./routes/weeks'));
app.use('/api/checkups', staticCache, require('./routes/checkups'));
app.use('/api/shopping', staticCache, require('./routes/shopping'));
app.use('/api/birth', staticCache, require('./routes/birth'));
app.use('/api/fourth-trimester', staticCache, require('./routes/fourth-trimester'));
app.use('/api/action-cards', staticCache, require('./routes/action-cards'));
app.use('/api/dad-module', staticCache, require('./routes/dad-module'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Ready Daddy', version: '1.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint nie znaleziony' });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

app.listen(PORT, () => {
  console.log('Ready Daddy Backend uruchomiony na porcie ' + PORT);
  console.log('API: http://localhost:' + PORT + '/api');

  // Periodic cleanup of expired revoked tokens (every 30 minutes)
  const db = require('./db/database');
  setInterval(() => {
    try {
      const result = db.prepare("DELETE FROM revoked_tokens WHERE expires_at < datetime('now')").run();
      if (result.changes > 0) {
        console.log(`[Cleanup] Usunięto ${result.changes} wygasłych tokenów.`);
      }
    } catch (err) {
      console.error('[Cleanup] Błąd czyszczenia revoked_tokens:', err);
    }
  }, 30 * 60 * 1000); // 30 minut
});

module.exports = app;
