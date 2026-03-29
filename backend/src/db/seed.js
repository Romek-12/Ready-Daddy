// Main seed script - runs all seed modules
console.log('=== HEJ PAPA - Seeding Database ===\n');

require('./seed-weeks');
require('./seed-cards-checkups');
require('./seed-shopping-birth');
require('./seed-fourth-trimester');

console.log('\n=== Seed completed successfully! ===');
process.exit(0);
