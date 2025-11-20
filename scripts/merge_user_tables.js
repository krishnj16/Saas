const pool = require('../utils/db');

function uuidRegex() {
  return "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
}

function fallbackForColumn(colName, dataType) {
  if (colName === 'password') {
    return "gen_random_uuid()::text";
  }
  if (colName.endsWith('_at') || colName === 'created_at' || colName === 'timestamp' || colName === 'checked_at' || colName === 'discovered_at' || colName === 'queued_at' || colName === 'started_at' || colName === 'finished_at') {
    return 'NOW()';
  }
  if (dataType.includes('timestamp') || dataType.includes('time')) {
    return 'NOW()';
  }
  if (dataType === 'boolean') {
    return 'false';
  }
  if (dataType.includes('int') || dataType === 'numeric' || dataType === 'bigint') {
    return '0';
  }
  return "'migrated'";
}

async function run() {
  try {
    console.log(' Starting safer merge from "User" -> users');

    console.log('  Creating backup user_backup and copying data...');
    await pool.query('CREATE TABLE IF NOT EXISTS user_backup AS TABLE "User" WITH NO DATA');
    await pool.query('TRUNCATE user_backup');
    await pool.query('INSERT INTO user_backup SELECT * FROM "User"');
    console.log(' Backup created: user_backup');

    const colsQuery = `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN ('User','users')
      ORDER BY table_name, ordinal_position;
    `;
    const colsRes = await pool.query(colsQuery);
    const byTable = {};
    for (const r of colsRes.rows) {
      byTable[r.table_name] = byTable[r.table_name] || [];
      byTable[r.table_name].push({
        name: r.column_name,
        data_type: r.data_type,
        is_nullable: r.is_nullable,
        column_default: r.column_default
      });
    }

    const userColsMeta = byTable['User'] || [];
    const usersColsMeta = byTable['users'] || [];

    if (userColsMeta.length === 0) {
      throw new Error('Source table "User" has no columns or does not exist.');
    }
    if (usersColsMeta.length === 0) {
      throw new Error('Target table users has no columns or does not exist.');
    }

    const userCols = userColsMeta.map(c => c.name);
    const usersCols = usersColsMeta.map(c => c.name);

    console.log(' "User" columns:', userCols.join(', '));
    console.log('  users columns:', usersCols.join(', '));

    const common = userCols.filter(c => usersCols.includes(c));
    if (!common.includes('id')) {
      throw new Error('No common "id" column found. Manual merge required.');
    }

    const requiredTargetCols = usersColsMeta
      .filter(c => c.is_nullable === 'NO' && (c.column_default === null))
      .map(c => ({ name: c.name, data_type: c.data_type }));

    console.log('Common columns to copy:', common.join(', '));
    console.log(' Required target columns without default:', requiredTargetCols.map(c => c.name).join(', ') || '(none)');

 
    const targetColsToInsert = Array.from(new Set([...common, ...requiredTargetCols.map(c => c.name)]));

   
    const regex = uuidRegex();
    const selectExprs = [];
    for (const col of targetColsToInsert) {
      if (col === 'id') {
        
        selectExprs.push(`(CASE WHEN pg_typeof(u.id)='uuid'::regtype THEN u.id WHEN pg_typeof(u.id)='text'::regtype AND u.id ~ '${regex}' THEN u.id::uuid ELSE NULL END) AS id`);
      } else if (common.includes(col)) {
        selectExprs.push(`u."${col}"`);
      } else {
        const meta = usersColsMeta.find(x => x.name === col);
        const fallback = fallbackForColumn(col, meta ? meta.data_type : 'text');
        selectExprs.push(`${fallback} AS "${col}"`);
      }
    }

    const insertColsList = targetColsToInsert.map(c => `"${c}"`).join(', ');
    const selectColsList = selectExprs.join(', ');
    const insertSQL = `
      WITH to_insert AS (
        SELECT
          ${targetColsToInsert.map(c => {
            if (c === 'id') return 'u.id::uuid AS id';
            if (common.includes(c)) return `u."${c}"`;
            
            const meta = usersColsMeta.find(x => x.name === c);
            const fallback = fallbackForColumn(c, meta ? meta.data_type : 'text');
            return `${fallback} AS "${c}"`;
          }).join(',\n          ')}
        FROM "User" u
        WHERE (
          pg_typeof(u.id) = 'uuid'::regtype
          OR (pg_typeof(u.id) = 'text'::regtype AND u.id ~ '${regex}')
        )
        AND NOT EXISTS (
          SELECT 1 FROM users t WHERE t.id = u.id::uuid
        )
      )
      INSERT INTO users (${insertColsList})
      SELECT ${targetColsToInsert.map(c => (c === 'id' ? 'id' : `"${c}"`)).join(', ')} FROM to_insert
      RETURNING id;
    `;

    console.log(' Running insert to merge rows (with fallbacks for required columns)...');
    const res = await pool.query(insertSQL);
    console.log(` Inserted ${res.rowCount} rows into users.`);

    const skippedRes = await pool.query(`
      SELECT COUNT(*) AS skipped_count
      FROM "User" u
      WHERE NOT (
        pg_typeof(u.id) = 'uuid'::regtype
        OR (pg_typeof(u.id) = 'text'::regtype AND u.id ~ '${regex}')
      );
    `);
    const skipped = Number(skippedRes.rows[0].skipped_count || 0);
    console.log(` Skipped ${skipped} source rows where id was not UUID-compatible.`);

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM "User") AS user_count,
        (SELECT COUNT(*) FROM users) AS users_count,
        (SELECT COUNT(*) FROM user_backup) AS backup_count;
    `);
    console.table(counts.rows);

    console.log('Merge completed. Backup available in user_backup.');
    if (skipped > 0) {
      console.log('Some rows were skipped. Inspect them with:');
      console.log(`node -e "const p=require('./backend/utils/db');(async()=>{const r=await p.query(\\\`SELECT id,* FROM \\"User\\" u WHERE NOT (pg_typeof(u.id)='uuid'::regtype OR (pg_typeof(u.id)='text'::regtype AND u.id ~ '${regex}')) LIMIT 200\\\`); console.table(r.rows); await p.end();})();"`);
    }
    console.log('If everything looks good you may DROP TABLE "User" (backup exists).');

  } catch (err) {
    console.error(' Merge failed:', err.message || err);
  } finally {
    await pool.end();
  }
}

run();
