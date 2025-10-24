module.exports = {
  SAFE_MODE: process.env.SAFE_MODE === 'true',
  DRY_RUN: process.env.DRY_RUN === 'true',
  CONSENT_FOR_COMMAND_INJECTION: process.env.CONSENT_FOR_COMMAND_INJECTION === 'true',
  GLOBAL_RATE_LIMIT_PER_SEC: Number(process.env.GLOBAL_RATE_LIMIT_PER_SEC || 1),
  GLOBAL_CONCURRENCY: Number(process.env.GLOBAL_CONCURRENCY || 4),
  SQLI_TIME_SLEEP_MS: Number(process.env.SQLI_TIME_SLEEP_MS || 2000),
  TIMING_THRESHOLD_MS: Number(process.env.TIMING_THRESHOLD_MS || 800),
  MAX_PROBES_PER_INPUT: Number(process.env.MAX_PROBES_PER_INPUT || 2),
  USER_AGENT: process.env.USER_AGENT || 'SaAs-Scanner/1.0'
};
