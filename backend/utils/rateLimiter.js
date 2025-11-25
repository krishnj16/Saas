const RATE_PER_SEC = Number(process.env.GLOBAL_RATE_LIMIT_PER_SEC || 1);
const BURST = 2;

const buckets = new Map();

function ensureBucket(origin) {
  if (!buckets.has(origin)) {
    buckets.set(origin, { tokens: BURST, lastRefill: Date.now() });
  }
}

function refill(origin) {
  const bucket = buckets.get(origin);
  const now = Date.now();
  const elapsed = (now - bucket.lastRefill) / 1000.0;
  if (elapsed <= 0) return;
  const add = elapsed * RATE_PER_SEC;
  bucket.tokens = Math.min(BURST, bucket.tokens + add);
  bucket.lastRefill = now;
}

async function throttleForSite(origin) {
  ensureBucket(origin);
  const bucket = buckets.get(origin);
  while (true) {
    refill(origin);
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return;
    }
    await new Promise(r => setTimeout(r, 250));
  }
}

module.exports = { throttleForSite };
