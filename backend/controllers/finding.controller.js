// // backend/controllers/finding.controller.js
// const db = require('../services/db');

// // GET /api/findings
// exports.getFindings = async (req, res) => {
//   try {
//     const sql = `
//       SELECT 
//         f.id, 
//         f.severity, 
//         f.status, 
//         f.description as title,
//         f.type as path, 
//         f.created_at,
//         w.url as website
//       FROM findings f
//       JOIN websites w ON f.website_id = w.id
//       ORDER BY f.created_at DESC
//     `;
    
//     const { rows } = await db.query(sql);
//     res.json(rows);
//   } catch (err) {
//     console.error('getFindings error:', err);
//     res.status(500).json({ error: 'Failed to fetch findings' });
//   }
// };

// // GET /api/findings/:id
// exports.getFindingById = async (req, res) => {
//   try {
//     const sql = `
//       SELECT 
//         f.*, 
//         f.description as title,
//         w.url as website
//       FROM findings f
//       JOIN websites w ON f.website_id = w.id
//       WHERE f.id = $1
//     `;
//     const { rows } = await db.query(sql, [req.params.id]);
    
//     if (rows.length === 0) {
//       return res.status(404).json({ error: 'Finding not found' });
//     }
    
//     res.json(rows[0]);
//   } catch (err) {
//     console.error('getFindingById error:', err);
//     res.status(500).json({ error: 'Failed to fetch finding details' });
//   }
// };

// // POST /api/findings/:id/confirm
// exports.confirmVulnerability = async (req, res) => {
//   try {
//     const sql = `UPDATE findings SET status = 'Confirmed' WHERE id = $1 RETURNING *`;
//     const { rows } = await db.query(sql, [req.params.id]);
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
const db = require('../services/db');

exports.getFindings = async (req, res) => {
  try {
    const userId = req.user.id; 

    const sql = `
      SELECT 
        f.id, 
        f.severity, 
        f.status, 
        f.description as title,
        f.type as path, 
        f.created_at,
        w.url as website
      FROM findings f
      JOIN websites w ON f.website_id = w.id
      WHERE w.owner_id = $1  -- <--- THIS WAS MISSING
      ORDER BY f.created_at DESC
    `;
    
    const { rows } = await db.query(sql, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('getFindings error:', err);
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
};

exports.getFindingById = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `
      SELECT 
        f.*, 
        f.description as title,
        w.url as website
      FROM findings f
      JOIN websites w ON f.website_id = w.id
      WHERE f.id = $1 AND w.owner_id = $2 -- <--- Security Check
    `;
    const { rows } = await db.query(sql, [req.params.id, userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Finding not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('getFindingById error:', err);
    res.status(500).json({ error: 'Failed to fetch finding details' });
  }
};

exports.confirmVulnerability = async (req, res) => {
  try {
    const sql = `UPDATE findings SET status = 'Confirmed' WHERE id = $1 RETURNING *`;
    const { rows } = await db.query(sql, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};