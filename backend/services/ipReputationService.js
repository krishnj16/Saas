const axios = require('axios');
const pool = require('../utils/db');

const DEFAULT_TTL = Number(process.env.IP_REPUTATION_CACHE_TTL || 86400);
const SHORT_TTL = Number(process.env.IP_REPUTATION_CACHE_SHORT_TTL || 300); 
const IPQS_API_KEY = process.env.IPQS_API_KEY || '';


function normalizeIpqsScore(body) {
  if (!body) return 0;
  if (typeof body.fraud_score === 'number') return body.fraud_score;
  if (body.recent_abuse) return 90;
  if (body.abuse_factor) return Number(body.abuse_factor) || 0;
  return 0;
}


async function getCachedResult(clientOrPool, ip, provider) {
  const q = `SELECT id, ip, provider, score, raw, ttl_at, created_at
             FROM ip_reputation_results
             WHERE ip = $1 AND provider = $2
             ORDER BY created_at DESC
             LIMIT 1`;
  const client = clientOrPool;
  const res = await client.query(q, [ip, provider]);
  if (res.rowCount === 0) return null;
  return res.rows[0];
}
async function storeResult(client, ip, provider, score, raw, ttlSeconds) {
  const ttlAt = new Date(Date.now() + (ttlSeconds * 1000)).toISOString();
  const sql = `INSERT INTO ip_reputation_results (ip, provider, score, raw, ttl_at, created_at)
               VALUES ($1,$2,$3,$4,$5, now())
               RETURNING id, ip, provider, score, raw, ttl_at, created_at`;
  const r = await client.query(sql, [ip, provider, score, raw, ttlAt]);
  return r.rows[0];
}

async function callIpqs(ip) {
  if (!IPQS_API_KEY) throw new Error('IPQS_API_KEY not set');
  const url = `https://ipqualityscore.com/api/json/ip/${IPQS_API_KEY}/${encodeURIComponent(ip)}`;
  const res = await axios.get(url, { timeout: 10_000 });
  return res.data;
}

async function getIpReputation(ip, provider = 'ipqs', bypassCache = false) {
  const client = pool;
  try {
    if (!bypassCache) {
      const cached = await getCachedResult(client, ip, provider);
      if (cached) {
        const now = new Date();
        if (cached.ttl_at && new Date(cached.ttl_at) > now) {
          return { cached: true, result: cached };
        }
      }
    }
    let raw;
    let score = 0;
    try {
      if (provider === 'ipqs') {
        raw = await callIpqs(ip);
        score = normalizeIpqsScore(raw);
        const stored = await storeResult(client, ip, provider, score, raw, DEFAULT_TTL);
        return { cached: false, result: stored };
      } else {
        throw new Error(`Unsupported provider ${provider}`);
      }
    } catch (err) {
      const rawErr = { error: String(err?.message || err) };
      const stored = await storeResult(client, ip, provider, 0, rawErr, SHORT_TTL);
      return { cached: false, result: stored, error: err.message || String(err) };
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  getIpReputation,
  normalizeIpqsScore,
  getCachedResult,
  storeResult
};
