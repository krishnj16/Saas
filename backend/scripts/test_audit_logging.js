

const pool = require('../utils/db');
const { logAudit } = require('../utils/auditLogger');

(async function test() {
  try {
    console.log('Starting audit log test...');

    let websiteId = null;
    try {
      const r = await pool.query(`SELECT id, url FROM websites WHERE deleted_at IS NULL LIMIT 1`);
      if (r.rows.length > 0) {
        websiteId = r.rows[0].id;
        console.log('Using existing website id:', websiteId, 'url=', r.rows[0].url);
      } else {
        const insertSite = await pool.query(
          `INSERT INTO websites (name, url, created_at)
           VALUES ($1, $2, NOW())
           RETURNING id`,
          ['__test_dummy_site__', 'https://example.test']
        );
        websiteId = insertSite.rows[0].id;
        console.log('Inserted dummy website id:', websiteId);
      }
    } catch (err) {
      console.error(' Failed to find/insert website:', err.message || err);
      throw err;
    }

    const insertRes = await pool.query(
      `INSERT INTO scan_tasks (website_id, status, queued_at, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW(), NOW()) RETURNING id`,
      [websiteId, 'queued']
    );

    const scanTaskId = insertRes.rows[0].id;
    console.log('Created scan_task:', scanTaskId, 'for website:', websiteId);

    await logAudit(websiteId, 'enqueue_scan_task', 'scan_task', scanTaskId, { note: 'test enqueue' });
    await logAudit(null, 'start_scan_task', 'scan_task', scanTaskId, { worker_id: 'test-worker' });
    await logAudit(null, 'finish_scan_task', 'scan_task', scanTaskId, { worker_id: 'test-worker' });

    const rows = (
      await pool.query(
        `SELECT id, user_id, action, resource_type, resource_id, data, timestamp
         FROM audit_logs
         WHERE resource_id = $1
         ORDER BY timestamp ASC`,
        [scanTaskId]
      )
    ).rows;

    console.log('\n📋 Audit entries for test task:');
    console.table(rows);

    console.log('\nAudit test completed successfully.');
  } catch (err) {
    console.error('Test failed:', err.message || err);
  } finally {
    await pool.end();
  }
})();
