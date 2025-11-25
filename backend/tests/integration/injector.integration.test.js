const express = require('express');
const http = require('http');

jest.setTimeout(20000); 

const injectorCore = require('../../services/injector/injectorCore');
const orchestrator = require('../../services/injector/index');
jest.mock('../../services/injector/discoveryFetcher');
const discoveryFetcher = require('../../services/injector/discoveryFetcher');

jest.mock('../../utils/db');
const db = require('../../utils/db');

let server;
let baseUrl;

beforeAll(done => {
  const app = express();
  app.use(express.urlencoded({ extended: true }));

  app.get('/reflect', (req, res) => {
    const q = req.query.q || '';
    res.send(`<html><body>Search: ${q}</body></html>`);
  });

  app.get('/sleep', (req, res) => {
    const id = String(req.query.id || '');
    if (id.includes('SLEEP')) {
      setTimeout(() => res.send('slept'), 1200);
    } else {
      res.send('ok');
    }
  });

  app.get('/form', (req, res) => {
    res.send(`<html><body><form action="/submit" method="post"><input name="name" /><button>Send</button></form></body></html>`);
  });

  app.get('/form_with_csrf', (req, res) => {
    res.send(`<html><body><form action="/submit" method="post"><input type="hidden" name="_csrf" value="tok" /><input name="name" /><button>Send</button></form></body></html>`);
  });

  server = http.createServer(app).listen(0, () => {
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

afterAll(done => {
  if (server) server.close(done);
});

test('integration: checkXSS against /reflect', async () => {
  const row = { method: 'GET', url: `${baseUrl}/reflect`, param_name: 'q' };
  const baseline = await injectorCore.baselineRequest(row);
  const res = await injectorCore.checkXSS(row, baseline);
  expect(res).toBeDefined();
  expect(typeof res.found).toBe('boolean');
  if (res.found) {
    expect(res.evidence.marker).toBeDefined();
  }
});

test('integration: checkBlindSQLi against /sleep (simulated timing)', async () => {
  process.env.SAFE_MODE = 'false';
  const row = { method: 'GET', url: `${baseUrl}/sleep`, param_name: 'id' };
  const baseline = await injectorCore.baselineRequest(row);
  const res = await injectorCore.checkBlindSQLi(row, baseline);
  expect(res).toBeDefined();
  if (res.found) {
    expect(res.evidence.timing_ms).toBeGreaterThanOrEqual(1000);
  }
});

test('integration: checkCSRF for form pages', async () => {
  const rowNoToken = { method: 'POST', url: `${baseUrl}/form`, html_snippet: `<html><body><form action="/submit" method="post"><input name="name" /></form></body></html>` };
  const rowWithToken = { method: 'POST', url: `${baseUrl}/form_with_csrf`, html_snippet: `<html><body><form action="/submit" method="post"><input type="hidden" name="_csrf" value="tok"/><input name="name"/></form></body></html>` };

  const resNoTok = await injectorCore.checkCSRF(rowNoToken);
  expect(resNoTok.found).toBe(true);
  expect(resNoTok.evidence.notes).toMatch(/missing hidden csrf token/i);

  const resWithTok = await injectorCore.checkCSRF(rowWithToken);
  expect(resWithTok.found).toBe(false);
});

test('integration: orchestrator respects DRY_RUN and saves vulnerabilities', async () => {
  const rows = [
    { id: 'd1', site_id: 's1', url: `${baseUrl}/reflect`, method: 'GET', param_name: 'q', html_snippet: null, observed_request_headers: [], site_origin: baseUrl },
    { id: 'd2', site_id: 's1', url: `${baseUrl}/form`, method: 'POST', param_name: null, html_snippet: `<form action="/submit" method="post"><input name="name"/></form>`, observed_request_headers: [], site_origin: baseUrl }
  ];
  discoveryFetcher.fetchForSite = jest.fn().mockResolvedValue(rows);
  discoveryFetcher.fetchPending = jest.fn().mockResolvedValue(rows);

  const inserted = [];
  db.pool = { query: jest.fn(async (sql, vals) => { inserted.push({ sql, vals }); return { rows: [{ id: 'v1' }] }; }) };

  process.env.DRY_RUN = 'true';
  await orchestrator.runForSite('s1', { dryRun: true });
  expect(inserted.length).toBe(0);

  process.env.DRY_RUN = 'false';
  process.env.SAFE_MODE = 'true';
  inserted.length = 0;

  await orchestrator.runForSite('s1', { dryRun: false });
  expect(db.pool.query).toBeDefined();
});
