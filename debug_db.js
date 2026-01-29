// debug_db.js  — run with: NODE_ENV=test node debug_db.js
require('./services/config'); // load env

const db = require('./services/db');

console.log('NODE_ENV =', process.env.NODE_ENV || 'undefined');
console.log('DB_URL =', process.env.DATABASE_URL || 'undefined');
console.log('VT_API =', process.env.VT_API_KEY || 'undefined');

console.log('db type =', typeof db);
console.log('has .raw =', !!db.raw);
console.log('has .query =', typeof db.query === 'function');
