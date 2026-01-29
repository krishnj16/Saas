const net = require('net');
const tls = require('tls');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const host = process.env.MAIL_HOST || 'smtp.mailtrap.io';
const port = Number(process.env.MAIL_PORT || 2525);
const useTls = false; 

logger.info('SMTP probe to', host, port, 'useTls=', useTls);

function plainProbe() {
  const s = net.createConnection({ host, port, timeout: 8000 }, () => {
    logger.info('connected -> sending EHLO');
    s.write('EHLO probe.example.com\r\n');
  });

  s.setEncoding('utf8');

  s.on('data', (d) => {
    logger.info('DATA:', d.replace(/\r\n/g, '\\r\\n\n'));
    if (d.includes('250')) {
      logger.info('Server returned 250 - closing socket');
      s.end();
    }
  });

  s.on('end', () => logger.info('socket end'));
  s.on('close', (had) => logger.info('socket close. hadError=', had));
  s.on('timeout', () => { logger.info('socket timeout'); s.destroy(); });
  s.on('error', (e) => logger.error('socket error', e && e.code ? e.code : e.message));
}

function tlsProbe() {
  const s = tls.connect({ host, port, timeout: 8000, servername: host }, () => {
    logger.info('tls connected -> sending EHLO');
    s.write('EHLO probe.example.com\r\n');
  });

  s.setEncoding('utf8');

  s.on('data', (d) => {
    logger.info('DATA:', d.replace(/\r\n/g, '\\r\\n\n'));
    if (d.includes('250')) {
      logger.info('Server returned 250 - closing socket');
      s.end();
    }
  });

  s.on('end', () => logger.info('socket end'));
  s.on('close', (had) => logger.info('socket close. hadError=', had));
  s.on('timeout', () => { logger.info('socket timeout'); s.destroy(); });
  s.on('error', (e) => logger.error('socket error', e && e.code ? e.code : e.message));
}

if (useTls) tlsProbe(); else plainProbe();
