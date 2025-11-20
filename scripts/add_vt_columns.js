const { Client } = require('pg');

(async () => {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:Maina@123@localhost:5432/saasdb';
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to DB, applying ALTER TABLE...');
    await client.query(`
      ALTER TABLE malware_results
        ADD COLUMN IF NOT EXISTS vt_response JSONB NULL,
        ADD COLUMN IF NOT EXISTS positives INT NULL,
        ADD COLUMN IF NOT EXISTS vt_last_seen TIMESTAMP WITH TIME ZONE NULL,
        ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_malware_results_sha256 ON malware_results(sha256);`);
    console.log('Schema updated successfully.');
  } catch (err) {
    console.error('Schema update failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end().catch(()=>{});
  }
})();
