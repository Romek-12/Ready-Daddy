/**
 * Export all static data from SQLite to JSON files for mobile app bundling.
 * Usage: node scripts/export-to-json.js
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/tata.db');
const outDir = path.resolve(__dirname, '../../mobile/src/data');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const db = new Database(dbPath, { readonly: true });

function exportTable(query, filename) {
  const rows = db.prepare(query).all();
  fs.writeFileSync(path.join(outDir, filename), JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Exported ${rows.length} rows -> ${filename}`);
  return rows;
}

// 1. Weeks
exportTable('SELECT * FROM weeks ORDER BY week_number', 'weeks.json');

// 2. Action cards
exportTable('SELECT * FROM action_cards ORDER BY week_min, id', 'action-cards.json');

// 3. Checkups (legacy)
exportTable('SELECT * FROM checkups ORDER BY week_number', 'checkups.json');

// 4. Shopping items
exportTable('SELECT * FROM shopping_items ORDER BY trimester, category, is_essential DESC', 'shopping-items.json');

// 5. Birth preparation
exportTable('SELECT * FROM birth_preparation ORDER BY stage', 'birth-preparation.json');

// 6. Bag checklist
exportTable('SELECT * FROM bag_checklist ORDER BY category, is_essential DESC', 'bag-checklist.json');

// 7. Fourth trimester
exportTable('SELECT * FROM fourth_trimester ORDER BY week_after_birth', 'fourth-trimester.json');

// 8. Checkup visits (nested structure)
const visits = db.prepare('SELECT * FROM checkup_visits ORDER BY sort_order').all();
const categories = db.prepare('SELECT * FROM checkup_categories ORDER BY visit_id, sort_order').all();
const items = db.prepare('SELECT * FROM checkup_items ORDER BY category_id, sort_order').all();

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

const checkupVisits = visits.map(v => ({
  id: v.id,
  weekRange: v.week_range,
  title: v.title,
  subtitle: v.subtitle,
  colorKey: v.color_key,
  categories: categoriesByVisit[v.id] || [],
}));

fs.writeFileSync(path.join(outDir, 'checkup-visits.json'), JSON.stringify(checkupVisits, null, 2), 'utf8');
console.log(`Exported ${checkupVisits.length} checkup visits (nested) -> checkup-visits.json`);

// 9. Dad module - just copy the JS module as JSON
const dadModule = require('../src/data/dad-module');
fs.writeFileSync(path.join(outDir, 'dad-module.json'), JSON.stringify(dadModule, null, 2), 'utf8');
console.log('Exported dad-module.json');

db.close();
console.log('\nAll data exported to:', outDir);
