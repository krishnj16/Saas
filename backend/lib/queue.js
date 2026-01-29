const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function enqueueJob(payload) {
  const id = uuidv4();
  const q = {
    id,
    payload: JSON.stringify(payload),
    status: 'queued',
    attempts: 0,
    created_at: new Date()
  };
  await db.query(
    `INSERT INTO jobs(id, payload, status, attempts, created_at)
     VALUES($1,$2,$3,$4,$5)`,
    [q.id, q.payload, q.status, q.attempts, q.created_at]
  );
  return q;
}

module.exports = { enqueueJob };