const express = require('express');
const router = express.Router();

const SITES = [
  { id: 1, name: 'Alpha', type: 'production', region: 'us' },
  { id: 2, name: 'Beta', type: 'staging', region: 'eu' },
  { id: 3, name: 'Gamma', type: 'production', region: 'apac' },
];

router.get('/', (req, res) => {
  let { q, type, region } = req.query;
  let results = [...SITES];

  if (q) {
    const ql = q.toLowerCase();
    results = results.filter(s => s.name.toLowerCase().includes(ql));
  }
  if (type) results = results.filter(s => s.type === type);
  if (region) results = results.filter(s => s.region === region);

  res.json({ items: results });
});

module.exports = router;
