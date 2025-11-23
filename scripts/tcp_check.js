const net = require('net');
const host = process.argv[2] || 'smtp.mailtrap.io';
const port = Number(process.argv[3] || 2525);
logger.info('Testing TCP', host, port);
const s = net.createConnection({ host, port, timeout: 5000 }, () => {
  logger.info('TCP connect success');
  s.end();
});
s.on('error', (e) => logger.error('TCP error:', e.message));
s.on('timeout', () => {
  logger.error('TCP timeout');
  s.destroy();
});
