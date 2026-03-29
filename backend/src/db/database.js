const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.resolve(__dirname, '../../', process.env.DB_PATH || './data/tata.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    partner_name TEXT DEFAULT '',
    conception_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS weeks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_number INTEGER UNIQUE NOT NULL,
    trimester INTEGER NOT NULL,
    fetus_size_mm REAL,
    fetus_weight_g REAL,
    fetus_size_comparison TEXT NOT NULL,
    fetus_description TEXT NOT NULL,
    partner_physical TEXT NOT NULL,
    partner_emotional TEXT NOT NULL,
    partner_hormonal TEXT NOT NULL,
    partner_tips TEXT NOT NULL,
    dad_symptoms TEXT DEFAULT '',
    dad_tips TEXT DEFAULT '',
    weekly_notification TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS action_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_min INTEGER NOT NULL,
    week_max INTEGER NOT NULL,
    title TEXT NOT NULL,
    scenario TEXT NOT NULL,
    scientific_explanation TEXT NOT NULL,
    concrete_action TEXT NOT NULL,
    icon TEXT DEFAULT '⚡'
  );

  CREATE TABLE IF NOT EXISTS checkups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    what_it_means TEXT NOT NULL,
    questions_to_ask TEXT NOT NULL,
    is_mandatory INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS shopping_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trimester INTEGER NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    is_essential INTEGER DEFAULT 1,
    estimated_cost_pln REAL DEFAULT 0,
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS birth_preparation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    partner_role TEXT NOT NULL,
    duration_info TEXT DEFAULT '',
    emergency_notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS bag_checklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    item_name TEXT NOT NULL,
    for_whom TEXT NOT NULL,
    is_essential INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS fourth_trimester (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_after_birth INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    baby_development TEXT DEFAULT '',
    relationship_tips TEXT DEFAULT '',
    warning_signs TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT UNIQUE NOT NULL,
    revoked_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS checkup_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_range TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    color_key TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS checkup_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER NOT NULL REFERENCES checkup_visits(id),
    title TEXT NOT NULL,
    icon TEXT NOT NULL,
    color_key TEXT NOT NULL,
    single_check INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS checkup_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES checkup_categories(id),
    name TEXT NOT NULL,
    optional INTEGER NOT NULL DEFAULT 0,
    note TEXT DEFAULT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );
`);

module.exports = db;
