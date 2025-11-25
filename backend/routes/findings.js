
const express = require('express');
const router = express.Router();
const sampleData = require('../data/findings.sample');

function parsePositiveInt(value, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return n;
}

router.get('/', (req, res) => {
  try {
    const { page: pageRaw, limit: limitRaw, q, severity, area } = req.query;
    const page = parsePositiveInt(pageRaw, 1);
    const limit = Math.min(parsePositiveInt(limitRaw, 10), 100); 

    let filtered = sampleData.slice();

    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      filtered = filtered.filter(item =>
        (item.title && item.title.toLowerCase().includes(needle)) ||
        (item.short_description && item.short_description.toLowerCase().includes(needle))
      );
    }

    if (severity && severity.trim()) {
      const sev = severity.trim().toLowerCase();
      filtered = filtered.filter(item => item.severity && item.severity.toLowerCase() === sev);
    }

    if (area && area.trim()) {
      const a = area.trim().toLowerCase();
      filtered = filtered.filter(item => item.area && item.area.toLowerCase() === a);
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageData = filtered.slice(start, end);

    res.json({
      data: pageData,
      meta: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (err) {
    console.error('Error in GET /api/findings', err);
    res.status(500).json({ error: 'Failed to fetch findings' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const found = sampleData.find(item => String(item.id) === String(id));
    if (!found) {
      return res.status(404).json({ error: 'Finding not found' });
    }
    return res.json({ data: found });
  } catch (err) {
    console.error('Error in GET /api/findings/:id', err);
    res.status(500).json({ error: 'Failed to fetch finding' });
  }
});

module.exports = router;
