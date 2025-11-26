
let logger = console;
try {
  logger = require('../services/logger');
} catch (e) {
}

const db = require('../services/db');
const WebsiteRepository = require('../repositories/website.repository');

function isValidUrl(s) {
  if (!s || typeof s !== 'string') return false;
  try {
    const u = new URL(s.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

exports.createWebsite = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    let { name, url } = req.body || {};
    name = typeof name === 'string' ? name.trim() : '';
    url = typeof url === 'string' ? url.trim() : '';

    if (!name || !url) {
      return res.status(400).json({ error: 'name and url required' });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'invalid_url' });
    }

    const sql = `
      INSERT INTO websites (owner_id, name, url, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, owner_id, name, url, created_at
    `;
    const params = [user.id, name, url];
    const result = await db.query(sql, params);

    const created = result.rows[0];
    logger.info(`[${req.id}] website created id=${created.id} owner=${created.owner_id}`);

    return res.status(201).json(created);
  } catch (err) {
    logger.error(`[${req.id}] createWebsite error`, err);
    next(err);
  }
};

exports.getWebsites = async (req, res, next) => {
  try {
    const owner_id = req.user && req.user.id;
    if (!owner_id) return res.status(401).json({ error: 'Unauthorized' });

    const websites = await WebsiteRepository.findByOwner(owner_id);
   
    res.json(Array.isArray(websites) ? websites : (websites?.items || []));
  } catch (err) {
    logger.error(`[${req.id}] getWebsites error`, err);
    next(err);
  }
};

exports.getWebsiteById = async (req, res, next) => {
  try {
    const website = await WebsiteRepository.findById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Not found' });
    if (!req.user || website.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json(website);
  } catch (err) {
    logger.error(`[${req.id}] getWebsiteById error`, err);
    next(err);
  }
};

exports.updateWebsite = async (req, res, next) => {
  try {
    const website = await WebsiteRepository.findById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Not found' });
    if (!req.user || website.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    if (req.body.url && !isValidUrl(req.body.url)) {
      return res.status(400).json({ error: 'Invalid URL for update' });
    }

    const updated = await WebsiteRepository.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error(`[${req.id}] updateWebsite error`, err);
    next(err);
  }
};

exports.deleteWebsite = async (req, res, next) => {
  try {
    const website = await WebsiteRepository.findById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Not found' });
    if (!req.user || website.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await WebsiteRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    logger.error(`[${req.id}] deleteWebsite error`, err);
    next(err);
  }
};
