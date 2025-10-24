jest.mock('axios');
const axios = require('axios');

const injectorCore = require('../../services/injector/injectorCore');

describe('injectorCore - unit tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
    process.env.SAFE_MODE = process.env.SAFE_MODE || 'true';
  });

  test('checkXSS returns boolean found and evidence shape if true', async () => {
    axios.mockResolvedValueOnce({ data: '<html>benign</html>' });
    axios.mockResolvedValueOnce({ data: '<html><script>document.write("__XSS_marker__")</script></html>' });

    const row = { method: 'GET', url: 'http://localhost/reflect', param_name: 'q' };
    const baseline = await injectorCore.baselineRequest(row);
    const res = await injectorCore.checkXSS(row, baseline);

    expect(res).toBeDefined();
    expect(typeof res.found).toBe('boolean');

    if (res.found) {
      expect(res.evidence).toBeDefined();
      expect(res.evidence.marker).toBeDefined();
      expect(res.evidence.response_snippet).toBeDefined();
    }
  });

  test('checkBlindSQLi returns object and may detect timing when SAFE_MODE=false', async () => {
    process.env.SAFE_MODE = 'false';
    axios.mockResolvedValueOnce({ data: 'ok' });
    axios.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: 'slow' }), 1200)));

    const row = { method: 'GET', url: 'http://localhost/sleep', param_name: 'id' };
    const baseline = await injectorCore.baselineRequest(row);
    const res = await injectorCore.checkBlindSQLi(row, baseline);

    expect(res).toBeDefined();
    expect(typeof res).toBe('object');
    if (res.found) {
      expect(res.evidence).toHaveProperty('timing_ms');
    }
  });
});
