
const request = require('supertest');
const express = require('express');
const nock = require('nock');
const malwareRoutes = require('../../routes/malwareRoutes');
const { vtGetFileReport, processJob } = require('../../workers/virusTotalWorker');
const { enqueueVTJob, fetchNextQueueJob } = require('../../services/malwareService');

const app = express();
app.use(express.json());
app.use('/api/malware', malwareRoutes);

describe('E2E VT flow', () => {
  beforeAll(async () => {
  });

  afterAll(() => {
    nock.cleanAll();
  });

  test('download-and-queue -> worker processes -> malware_results created', async () => {
    const sampleZipPath = require('path').join(__dirname, '..', 'unit', 'fixtures', 'sample.zip');
    nock('https://plugins.example.com').get('/plugin.zip').replyWithFile(200, sampleZipPath, { 'Content-Type': 'application/zip' });

    const sha = 'e2esha256placeholder'; 
    nock('https://www.virustotal.com').get(/\/api\/v3\/files\/.*/).reply(200, {
      data: { attributes: { last_analysis_stats: { malicious: 1, suspicious: 0 } } }
    });

    const res = await request(app)
      .post('/api/malware/download-and-queue')
      .send({ url: 'https://plugins.example.com/plugin.zip' })
      .expect(200);

    expect(res.body).toHaveProperty('sha256');

    const job = await fetchNextQueueJob();
    expect(job).toBeDefined();

    await processJob(job);

    const db = require('../../utils/db');
    const r = await db.query('SELECT * FROM malware_results WHERE sha256 = $1', [res.body.sha256]);
    expect(r.rows.length).toBeGreaterThanOrEqual(1);
  }, 20000);
});
