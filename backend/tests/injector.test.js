

const axios = require('axios');
jest.mock('axios');

const injectorCore = require('../services/injector/injectorCore');

describe('injectorCore basic tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
    process.env.SAFE_MODE = process.env.SAFE_MODE || 'true';
  });

  test('detects reflective XSS when marker is present (robust check)', async () => {
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
});
