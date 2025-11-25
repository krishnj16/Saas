
function sanitizeHeaders(headers = {}) {
  const copy = {};
  for (const k of Object.keys(headers || {})) {
    if (/authorization|cookie|set-cookie/i.test(k)) continue;
    copy[k] = headers[k];
  }
  return copy;
}

function sanitizeEvidence(evidence) {
  const ev = { ...evidence };
  if (ev.request && ev.request.headers) ev.request.headers = sanitizeHeaders(ev.request.headers);
  if (ev.request && ev.request.body_snippet) ev.request.body_snippet = String(ev.request.body_snippet).slice(0, 2000);
  if (ev.response_snippet) ev.response_snippet = String(ev.response_snippet).slice(0, 2000);
  return ev;
}

module.exports = { sanitizeEvidence, sanitizeHeaders };
