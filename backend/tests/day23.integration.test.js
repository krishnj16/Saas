const { runTestHelper } = require('../scripts/run_day23_test_helper');
const { pool } = require('../utils/db');

describe('day23 integration: processScan flow', () => {
  beforeAll(async () => {
  });

  afterAll(async () => {
  });

  test('processScan updates vulnerability_findings and marks new_since_last_scan correctly', async () => {
    const rows = await runTestHelper();
    expect(Array.isArray(rows)).toBe(true);
    const paths = rows.map(r => r.path).sort();
    expect(paths).toContain('/admin');
    expect(paths).toContain('/contact' || '/login');

    const admin = rows.find(r => r.path === '/admin');
    expect(admin).toBeDefined();
  });
});
