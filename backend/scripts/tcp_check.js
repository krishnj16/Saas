const net = require('net');
const host = process.argv[2] || 'smtp.mailtrap.io';
const port = Number(process.argv[3] || 2525);
console.log('Testing TCP', host, port);
const s = net.createConnection({ host, port, timeout: 5000 }, () => {
  console.log('TCP connect success');
  s.end();
});
s.on('error', (e) => console.error('TCP error:', e.message));
s.on('timeout', () => {
  console.error('TCP timeout');
  s.destroy();
});
