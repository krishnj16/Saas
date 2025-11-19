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
    console.log('DEBUG createWebsite - user:', req.user);
    console.log('DEBUG createWebsite - body:', req.body);

    const owner_id = req.user && req.user.id;
    if (!owner_id) return res.status(401).json({ error: 'Unauthorized' });

    const { url, active } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });
    if (!isValidUrl(url)) return res.status(400).json({ error: 'Invalid URL. ' });

    const website = await WebsiteRepository.create({
      url: url.trim(),
      owner_id,
      active,
    });
    res.status(201).json(website);
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'Website already exists for this owner' });
    }
    next(err);
  }
};

exports.getWebsites = async (req, res, next) => {
  try {
    const owner_id = req.user && req.user.id;
    if (!owner_id) return res.status(401).json({ error: 'Unauthorized' });

    const websites = await WebsiteRepository.findByOwner(owner_id);
    res.json(websites);
  } catch (err) {
    next(err);
  }
};

exports.getWebsiteById = async (req, res, next) => {
  try {
    const website = await WebsiteRepository.findById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Not found' });
    if (website.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    res.json(website);
  } catch (err) {
    next(err);
  }
};

exports.updateWebsite = async (req, res, next) => {
  try {
    const website = await WebsiteRepository.findById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Not found' });
    if (website.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    if (req.body.url && !isValidUrl(req.body.url)) {
      return res.status(400).json({ error: 'Invalid URL for update' });
    }

    const updated = await WebsiteRepository.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deleteWebsite = async (req, res, next) => {
  try {
    const website = await WebsiteRepository.findById(req.params.id);
    if (!website) return res.status(404).json({ error: 'Not found' });
    if (website.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await WebsiteRepository.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
