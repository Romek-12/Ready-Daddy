const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Set up test environment before requiring app
process.env.JWT_SECRET = 'test-secret-key-for-testing-only-32chars';
process.env.DB_PATH = path.join(__dirname, '../data/test_tata.db');
process.env.NODE_ENV = 'test';

const app = require('../src/server');

const TEST_USER = {
  email: `test_${Date.now()}@hejpapa.test`,
  password: 'TestPassword123!',
  conceptionDate: '2025-01-15',
  partnerName: 'Testowa',
};

let authToken = null;

const db = require('../src/db/database');

afterAll(() => {
  // Close the database connection to release file locks on Windows
  try { db.close(); } catch (e) {}
  
  // Clean up test database
  const testDbPath = process.env.DB_PATH;
  [testDbPath, `${testDbPath}-shm`, `${testDbPath}-wal`].forEach(f => {
    if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch (e) { console.error('Could not delete', f, e); }
  });
});

describe('GET /api/health', () => {
  it('zwraca status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('HEJ PAPA');
  });
});

describe('POST /api/auth/register', () => {
  it('rejestruje nowego użytkownika', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER.email);
    authToken = res.body.token;
  });

  it('odrzuca duplikat email', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it('odrzuca brak wymaganych pól', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  it('odrzuca nieprawidłowy format daty poczęcia', async () => {
    const res = await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'other@test.com',
      conceptionDate: '15/01/2025',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/format/i);
  });
});

describe('POST /api/auth/login', () => {
  it('loguje istniejącego użytkownika', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('odrzuca złe hasło', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('zwraca profil z prawidłowym tokenem', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_USER.email);
  });

  it('odrzuca żądanie bez tokenu', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('wylogowuje użytkownika i unieważnia token', async () => {
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${authToken}`);
    expect(logoutRes.status).toBe(200);

    // Token should now be rejected
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(meRes.status).toBe(401);
  });
});

describe('GET /api/action-cards/deck', () => {
  let freshToken = null;

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    freshToken = res.body.token;
  });

  it('zwraca talie kart reakcji', async () => {
    const res = await request(app)
      .get('/api/action-cards/deck')
      .set('Authorization', `Bearer ${freshToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.cards.length).toBeGreaterThan(0);
    const card = res.body.cards[0];
    expect(card).toHaveProperty('id');
    expect(card).toHaveProperty('trimester');
    expect(Array.isArray(card.herSide)).toBe(true);
    expect(Array.isArray(card.do)).toBe(true);
    expect(Array.isArray(card.dont)).toBe(true);
  });
});
