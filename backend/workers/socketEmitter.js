const { getIo } = require('../sockets');
const emailService = require('../services/emailService'); 

function buildUiSummary({ scan_task_id, website_id, counts, summary }) {
  return {
    scan_task_id,
    website_id,
    counts,
    text: summary || `Scan completed with ${counts.critical || 0} critical, ${counts.high || 0} high`,
    report_url: `${process.env.APP_BASE_URL || 'http://localhost:4000'}/reports/${scan_task_id}`,
  };
}

function safeGetIo() {
  try {
    return getIo();
  } catch (err) {
    console.warn('[socketEmitter] getIo() failed:', err.message);
    return null;
  }
}

function emitScanStarted(userId, { scan_task_id, website_id }) {
  const io = safeGetIo();
  const payload = { scan_task_id, website_id, timestamp: Date.now() };
  if (io) io.to(`user:${userId}`).emit('scan:started', payload);
  else console.log('[socketEmitter] emitScanStarted (no io) ->', payload);
}

function emitScanProgress(userId, { scan_task_id, percent, current_scanner }) {
  const io = safeGetIo();
  const payload = { scan_task_id, percent, current_scanner, timestamp: Date.now() };
  if (io) io.to(`user:${userId}`).emit('scan:progress', payload);
  else console.log('[socketEmitter] emitScanProgress (no io) ->', payload);
}

async function emitVulnFound(user, { scan_task_id, website_id, vuln }) {
  const io = safeGetIo();
  const payload = { scan_task_id, website_id, vuln, timestamp: Date.now() };
  if (io) io.to(`user:${user.id}`).emit('vuln:found', payload);
  else console.log('[socketEmitter] vuln:found (no io) ->', payload);

  const severity = (vuln.severity || '').toString().toLowerCase();
  if (severity === 'critical') {
    if (typeof emailService.sendCriticalVulnEmail === 'function') {
      try {
        await emailService.sendCriticalVulnEmail({
          to: user.email,
          userName: user.name,
          scan_task_id,
          website_url: website_id,
          vulnSummary: { text: vuln.title, counts: { critical: 1 }, vuln_title: vuln.title },
        });
        console.log('[socketEmitter] critical vuln email attempted for', user.email);
      } catch (err) {
        console.error('[socketEmitter] Error sending critical vuln email:', err.message);
      }
    } else {
      console.warn('[socketEmitter] emailService.sendCriticalVulnEmail not found - skipping email', { user: user.email, scan_task_id });
    }
  }
}

function emitScanFinished(userId, { scan_task_id, website_id, counts, summary }) {
  const io = safeGetIo();
  const payload = {
    scan_task_id,
    website_id,
    counts,
    summary,
    timestamp: Date.now(),
    ui_summary: buildUiSummary({ scan_task_id, website_id, counts, summary }),
  };
  if (io) io.to(`user:${userId}`).emit('scan:finished', payload);
  else console.log('[socketEmitter] emitScanFinished (no io) ->', payload);
}

module.exports = {
  emitScanStarted,
  emitScanProgress,
  emitVulnFound,
  emitScanFinished,
};
