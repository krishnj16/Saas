// const db = require('../services/db');

// exports.getDashboardStats = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const websiteCount = await db.query(
//       'SELECT COUNT(*) FROM websites WHERE owner_id = $1', 
//       [userId]
//     );
    
//     const vulnCount = await db.query(`
//       SELECT COUNT(f.id) 
//       FROM findings f
//       JOIN websites w ON f.website_id = w.id
//       WHERE w.owner_id = $1 AND f.status = 'Open'`, 
//       [userId]
//     );

//     const scanCount = await db.query(`
//       SELECT COUNT(s.id) 
//       FROM scan_tasks s
//       JOIN websites w ON s.website_id = w.id
//       WHERE w.owner_id = $1`,
//       [userId]
//     );

//     const recentActivity = await db.query(`
//       SELECT s.id, s.status, s.created_at, w.url, w.name
//       FROM scan_tasks s
//       JOIN websites w ON s.website_id = w.id
//       WHERE w.owner_id = $1
//       ORDER BY s.created_at DESC
//       LIMIT 5`,
//       [userId]
//     );

//     res.json({
//       totalWebsites: parseInt(websiteCount.rows[0].count),
//       openVulnerabilities: parseInt(vulnCount.rows[0].count),
//       totalScans: parseInt(scanCount.rows[0].count),
//       recentActivity: recentActivity.rows
//     });

//   } catch (err) {
//     console.error('Dashboard Stats Error:', err);
//     res.status(500).json({ error: 'Failed to load dashboard' });
//   }
// };

const db = require('../services/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const websiteCount = await db.query(
      'SELECT COUNT(*) FROM websites WHERE owner_id = $1', 
      [userId]
    );
    
    const vulnCount = await db.query(`
      SELECT COUNT(f.id) 
      FROM findings f
      JOIN websites w ON f.website_id = w.id
      WHERE w.owner_id = $1 AND f.status = 'Open'`, 
      [userId]
    );

    const scanCount = await db.query(`
      SELECT COUNT(s.id) 
      FROM scan_tasks s
      JOIN websites w ON s.website_id = w.id
      WHERE w.owner_id = $1`,
      [userId]
    );

    const recentActivity = await db.query(`
      SELECT s.id, s.status, s.created_at, w.url, w.name
      FROM scan_tasks s
      JOIN websites w ON s.website_id = w.id
      WHERE w.owner_id = $1
      ORDER BY s.created_at DESC
      LIMIT 5`,
      [userId]
    );

    res.json({
      totalWebsites: parseInt(websiteCount.rows[0].count || 0),
      openVulnerabilities: parseInt(vulnCount.rows[0].count || 0),
      totalScans: parseInt(scanCount.rows[0].count || 0),
      recentActivity: recentActivity.rows
    });

  } catch (err) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};