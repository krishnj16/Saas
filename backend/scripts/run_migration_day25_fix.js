const fs = require('fs');
const path = require('path');
const pool = require('../utils/db');

async function colExists(client, table, col) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2 LIMIT 1`,
    [table, col]
  );
  return r.rowCount > 0;
}

async function tableExists(client, table) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name=$1 LIMIT 1`,
    [table]
  );
  return r.rowCount > 0;
}

async function run() {
  const client = await pool.connect();
  try {
    logger.info('Starting migration fix for day25...');
    await client.query('BEGIN');

    if (!await tableExists(client, 'scan_ips')) {
      logger.info('Creating table scan_ips');
      await client.query(`
        CREATE TABLE IF NOT EXISTS scan_ips (
          id SERIAL PRIMARY KEY,
          scan_id UUID,
          host TEXT,
          ip TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `);
    } else {
      logger.info('Table scan_ips exists — ensuring columns...');
      if (!await colExists(client, 'scan_ips', 'scan_id')) {
        await client.query(`ALTER TABLE scan_ips ADD COLUMN IF NOT EXISTS scan_id UUID`);
        logger.info('  added scan_id');
      }
      if (!await colExists(client, 'scan_ips', 'host')) {
        await client.query(`ALTER TABLE scan_ips ADD COLUMN IF NOT EXISTS host TEXT`);
        logger.info('  added host');
      }
      if (!await colExists(client, 'scan_ips', 'ip')) {
        await client.query(`ALTER TABLE scan_ips ADD COLUMN IF NOT EXISTS ip TEXT`);
        logger.info('  added ip');
      }
      if (!await colExists(client, 'scan_ips', 'created_at')) {
        await client.query(`ALTER TABLE scan_ips ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now()`);
        logger.info('  added created_at');
      }
    }
    if (!await tableExists(client, 'ip_reputation_queue')) {
      logger.info('Creating table ip_reputation_queue');
      await client.query(`
        CREATE TABLE IF NOT EXISTS ip_reputation_queue (
          id SERIAL PRIMARY KEY,
          scan_id UUID,
          host_id INTEGER,
          ip TEXT NOT NULL,
          provider TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          enqueued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          processed_at TIMESTAMP WITH TIME ZONE
        )
      `);
    } else {
      logger.info('Table ip_reputation_queue exists — ensuring columns...');
      const cols = [
        ['scan_id', 'UUID'],
        ['host_id', 'INTEGER'],
        ['ip', 'TEXT'],
        ['provider', 'TEXT'],
        ['status', "TEXT NOT NULL DEFAULT 'pending'"],
        ['attempts', 'INTEGER NOT NULL DEFAULT 0'],
        ['last_error', 'TEXT'],
        ['enqueued_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()'],
        ['processed_at', 'TIMESTAMP WITH TIME ZONE']
      ];
      for (const [c, def] of cols) {
        if (!await colExists(client, 'ip_reputation_queue', c)) {
          logger.info('  adding', c);
          await client.query(`ALTER TABLE ip_reputation_queue ADD COLUMN IF NOT EXISTS ${c} ${def}`);
        }
      }
    }
    if (!await tableExists(client, 'ip_reputation_results')) {
      logger.info('Creating table ip_reputation_results');
      await client.query(`
        CREATE TABLE IF NOT EXISTS ip_reputation_results (
          id SERIAL PRIMARY KEY,
          ip TEXT NOT NULL,
          provider TEXT NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          raw JSONB,
          ttl_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `);
    } else {
      logger.info('Table ip_reputation_results exists — ensuring columns...');
      const cols = [
        ['ip', 'TEXT'],
        ['provider', 'TEXT'],
        ['score', 'INTEGER NOT NULL DEFAULT 0'],
        ['raw', 'JSONB'],
        ['ttl_at', 'TIMESTAMP WITH TIME ZONE'],
        ['created_at', 'TIMESTAMP WITH TIME ZONE DEFAULT now()']
      ];
      for (const [c, def] of cols) {
        if (!await colExists(client, 'ip_reputation_results', c)) {
          logger.info('  adding', c);
          await client.query(`ALTER TABLE ip_reputation_results ADD COLUMN IF NOT EXISTS ${c} ${def}`);
        }
      }
    }
    const providerExists = await colExists(client, 'ip_reputation_results', 'provider');
    if (providerExists) {
      logger.info('Creating index idx_ip_reputation_results_ip_provider');
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ip_reputation_results_ip_provider ON ip_reputation_results (ip, provider)`);
    } else {
      logger.info('Provider column missing — creating ip-only index idx_ip_reputation_results_ip');
      await client.query(`CREATE INDEX IF NOT EXISTS idx_ip_reputation_results_ip ON ip_reputation_results (ip)`);
    }

    logger.info('Creating index idx_ip_reputation_queue_status');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_ip_reputation_queue_status ON ip_reputation_queue (status)`);

    await client.query('COMMIT');
    logger.info('Migration fix applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Migration fix failed:', err);
    process.exitCode = 1;
  } finally {
    try { client.release(); } catch (e) {}
    try { await pool.end(); } catch (e) {}
  }
}

run();
