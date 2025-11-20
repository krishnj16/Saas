const axios = require('axios');
const RobotsParser = require('robots-parser');

const CACHE_TTL_MS = 1000 * 60 * 60; 
const cache = new Map();

async function getRobots(origin) {
  try {
    const now = Date.now();
    const cached = cache.get(origin);
    if (cached && (now - cached.fetchedAt) < CACHE_TTL_MS) return cached.robots;
    const robotsUrl = new URL('/robots.txt', origin).href;
    const res = await axios.get(robotsUrl, { timeout: 5000 }).catch(() => ({ data: '' }));
    const robots = RobotsParser(robotsUrl, res.data || '');
    cache.set(origin, { robots, fetchedAt: now });
    return robots;
  } catch (err) {
    console.warn('[robotsCache] error', err);
    return null;
  }
}

module.exports = { getRobots };
