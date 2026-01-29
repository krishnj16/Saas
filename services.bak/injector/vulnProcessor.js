// backend/services/vulnProcessor.js
// Minimal vulnProcessor implementation needed by unit tests.
// Contains getNormalizedSeverity, computeFingerprint, applyRules and exports applyRules.

const crypto = require('crypto');

/**
 * Normalize severity mapping fallback (used by other code as well)
 */
function getNormalizedSeverity(scanner, scannerSeverity) {
  const s = (scannerSeverity || '').toLowerCase();
  if (s.includes('crit')) return 'critical';
  if (s.includes('high')) return 'high';
  if (s.includes('medium') || s.includes('med')) return 'medium';
  if (s.includes('low') || s.includes('info') || s.includes('inform')) return 'low';
  return 'medium';
}

function computeFingerprint(raw) {
  if (raw && raw.scanner_fingerprint) return raw.scanner_fingerprint;
  const str = `${raw && raw.scanner ? raw.scanner : ''}|${raw && raw.type ? raw.type : ''}|${raw && raw.path ? raw.path : ''}|${raw && raw.parameter ? raw.parameter : ''}|${JSON.stringify(raw && raw.raw ? raw.raw : {})}`;
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Rule engine
 * - if vt_malicious -> critical
 * - if many hosts non-exploitable -> medium
 * - if exploitability_score >= 7 -> bump one level
 */
function applyRules(finding, context = {}) {
  // clone safe defaults
  const tags = new Set(Array.isArray(finding.rule_tags) ? finding.rule_tags : []);
  let sev = finding.normalized_severity || getNormalizedSeverity(finding.scanner, finding.scanner_severity || '');

  // Rule: VirusTotal malicious -> critical
  if (finding.vt_malicious) {
    tags.add('vt_malicious');
    sev = 'critical';
  }

  // Rule: many hosts with low exploitability -> force/keep medium
  if (context.occurrencesAcrossHosts && context.occurrencesAcrossHosts >= (context.threshold || 5)) {
    if ((context.exploitabilityAggregate || 0) === 0) {
      tags.add('many_hosts_non_exploitable');
      const order = { low: 0, medium: 1, high: 2, critical: 3 };
      if (order[sev] > order['medium']) sev = 'medium';
    }
  }

  // Rule: exploitability bump
  if ((finding.exploitability_score || 0) >= 7) {
    const bump = { low: 'medium', medium: 'high', high: 'critical', critical: 'critical' };
    sev = bump[sev] || sev;
    tags.add('exploitability_high');
  }

  return { normalized_severity: sev, rule_tags: Array.from(tags) };
}

module.exports = {
  getNormalizedSeverity,
  computeFingerprint,
  applyRules
};
