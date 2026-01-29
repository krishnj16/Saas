const fs = require('fs');
const path = require('path');
const { parseWpscan } = require('../parsers/parse-wpscan');
const { parseWapiti } = require('../parsers/parse-wapiti');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

describe('Parsers produce unified vuln objects', () => {
  test('parseWpscan returns unified objects', () => {
    const raw = loadFixture('wpscan-sample.json');
    const out = parseWpscan(raw);
    expect(Array.isArray(out)).toBe(true);
    if (out.length === 0) return;
    const v = out[0];
    expect(v).toHaveProperty('scanner', 'wpscan');
    expect(v).toHaveProperty('type');
    expect(v).toHaveProperty('severity');
    expect(typeof v.title).toBe('string');
    expect(v).toHaveProperty('raw');
  });

  test('parseWapiti returns unified objects', () => {
    const raw = loadFixture('wapiti-sample.json');
    const out = parseWapiti(raw);
    expect(Array.isArray(out)).toBe(true);
    if (out.length === 0) return;
    const v = out[0];
    expect(v).toHaveProperty('scanner', 'wapiti');
    expect(v).toHaveProperty('type');
    expect(v).toHaveProperty('severity');
    expect(typeof v.title).toBe('string');
    expect(v).toHaveProperty('raw');
  });
});
