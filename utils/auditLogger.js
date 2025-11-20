const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); 

const pool = require('./db'); 


async function logAudit(userId, action, resourceType, resourceId, data = null) {
  try {
    const res = await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, timestamp`,
      [userId || null, action, resourceType, resourceId || null, data ? JSON.stringify(data) : null]
    );
    console.log(`[audit] Logged ${action} (id=${res.rows[0].id})`);
    return res.rows[0];
  } catch (err) {
    console.error('[audit] Failed to log audit entry:', err.message || err);
    return null; 
  }
}

module.exports = { logAudit };
