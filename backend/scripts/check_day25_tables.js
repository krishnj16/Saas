const pool = require('../utils/db');

async function run() {
  const client = await pool.connect();
  try {
    const tables = ['scan_ips','ip_reputation_queue','ip_reputation_results'];
    for (const t of tables) {
      const r = await client.query(
        `SELECT to_regclass($1) AS exists, count(*) FILTER (WHERE table_name = $2) AS placeholder FROM information_schema.tables WHERE table_name = $2`,
        [t, t]
      );
      const existsRes = await client.query(`SELECT 1 FROM information_schema.tables WHERE table_name = $1 LIMIT 1`, [t]);
      const exists = existsRes.rowCount > 0;
      const countRes = exists ? await client.query(`SELECT count(*) AS c FROM ${t}`) : { rows: [{ c: 0 }] };
      console.log(`${t}: exists=${exists} rows=${countRes.rows[0].c}`);
    }
  } catch (err) {
    console.error('check failed', err);
  } finally {
    try { client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
}

run();
