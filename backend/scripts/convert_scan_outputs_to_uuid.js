

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../utils/db');

async function getQuery() {
  if (db && db.pool && typeof db.pool.query === 'function') return db.pool.query.bind(db.pool);
  if (db && typeof db.query === 'function') return db.query.bind(db);
  if (db && db.client && typeof db.client.query === 'function') return db.client.query.bind(db.client);
  throw new Error('Could not find query() in backend/utils/db.js');
}

async function convert() {
  const query = await getQuery();

  console.log('--- Starting UUID migration for scan_outputs.scan_task_id ---');

  console.log('1️ Create pgcrypto extension (needed for gen_random_uuid)');
  await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  console.log('2️ Add temporary UUID column');
  await query(`ALTER TABLE scan_outputs ADD COLUMN IF NOT EXISTS scan_task_id_uuid uuid;`);

  console.log('3️ Fill new column with UUIDs where null');
  await query(`UPDATE scan_outputs SET scan_task_id_uuid = gen_random_uuid() WHERE scan_task_id_uuid IS NULL;`);

  console.log('4️ Drop old integer column');
  await query(`ALTER TABLE scan_outputs DROP COLUMN IF EXISTS scan_task_id;`);

  console.log('5️ Rename new column');
  await query(`ALTER TABLE scan_outputs RENAME COLUMN scan_task_id_uuid TO scan_task_id;`);

  console.log('6️ Confirm new column type');
  const res = await query(`
    SELECT data_type
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='scan_outputs'
      AND column_name='scan_task_id'
    LIMIT 1;
  `);
  console.log('   New type:', res.rows?.[0]?.data_type);

  console.log(' Done! scan_outputs.scan_task_id is now UUID type.');
  process.exit(0);
}

convert().catch(err => {
  console.error(' Migration failed:', err);
  process.exit(1);
});
