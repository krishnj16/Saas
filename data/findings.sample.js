

module.exports = [
  {
    id: 1,
    title: 'Outdated WordPress Plugin Detected',
    short_description: 'Plugin "contact-form" is 3 versions behind and has known XSS issues.',
    area: 'website-frontend',
    severity: 'high',
    discovered_at: '2025-11-20T09:15:00.000Z',
    evidence: {
      plugin: 'contact-form',
      installed_version: '3.1.2',
      latest_version: '3.4.0',
      vulnerability: 'Stored XSS in form input sanitizer',
      proof: {
        request: 'POST /wp-admin/admin-ajax.php?action=submit',
        payload: '<script>alert(1)</script>',
        response_snippet: '<script>alert(1)</script>'
      }
    },
    recommended_actions: [
      { id: 'patch', label: 'Update plugin to latest' },
      { id: 'disable', label: 'Disable plugin if unused' }
    ]
  },
  {
    id: 2,
    title: 'Weak S3 Bucket Permissions',
    short_description: 'S3 bucket "assets-prod" allows public list access.',
    area: 'infrastructure',
    severity: 'critical',
    discovered_at: '2025-11-19T12:00:00.000Z',
    evidence: {
      bucket: 'assets-prod',
      acl: 'public-read',
      policy: {
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject', 's3:ListBucket']
      },
      proof: { listed_example_key: 'images/logo.png' }
    },
    recommended_actions: [
      { id: 'lockdown', label: 'Remove public access' },
      { id: 'audit', label: 'Audit IAM policies' }
    ]
  },
  {
    id: 3,
    title: 'Insecure TLS Ciphers',
    short_description: 'Server supports RC4 and TLS1.0 — weak config.',
    area: 'infrastructure',
    severity: 'medium',
    discovered_at: '2025-11-18T07:30:00.000Z',
    evidence: {
      host: 'api.example.com',
      supported_protocols: ['TLSv1', 'TLSv1.1', 'TLSv1.2'],
      unsupported_recommendation: ['Disable TLSv1', 'Disable RC4 cipher']
    },
    recommended_actions: [
      { id: 'update-tls', label: 'Enforce TLS 1.2+ only' },
      { id: 'reconfigure', label: 'Remove RC4 ciphers' }
    ]
  },
  {
    id: 4,
    title: 'Unvalidated Redirect',
    short_description: 'Open redirect found at /redirect?to= parameter.',
    area: 'website-frontend',
    severity: 'low',
    discovered_at: '2025-11-17T15:00:00.000Z',
    evidence: {
      path: '/redirect?to=https://evil.test',
      behavior: 'Redirects to external URL without validation',
      impact: 'Phishing potential'
    },
    recommended_actions: [
      { id: 'validate', label: 'Allow only whitelisted hosts' },
      { id: 'encode', label: 'Use a lookup token instead of URL' }
    ]
  },
  {
    id: 5,
    title: 'SQL Injection (Possible)',
    short_description: 'Suspicious parameter used directly in SQL query.',
    area: 'backend',
    severity: 'high',
    discovered_at: '2025-11-16T23:45:00.000Z',
    evidence: {
      endpoint: '/api/users?search=',
      example_payload: "' OR '1'='1",
      stack_trace_snippet: null
    },
    recommended_actions: [
      { id: 'paramize', label: 'Use parameterized queries' },
      { id: 'sanitize', label: 'Sanitize input server-side' }
    ]
  },
  {
    id: 6,
    title: 'Exposed Debug Endpoint',
    short_description: '/debug/info accessible in production.',
    area: 'backend',
    severity: 'medium',
    discovered_at: '2025-11-15T11:05:00.000Z',
    evidence: {
      endpoint: '/debug/info',
      response_excerpt: '{ "env": "production", "node_version": "18.12" }'
    },
    recommended_actions: [
      { id: 'remove', label: 'Remove debug endpoints from prod' }
    ]
  },
  {
    id: 7,
    title: 'Missing CSP Header',
    short_description: 'No Content-Security-Policy header present on site.',
    area: 'website-frontend',
    severity: 'low',
    discovered_at: '2025-11-14T08:40:00.000Z',
    evidence: {
      request: 'GET /',
      headers: { 'content-security-policy': null }
    },
    recommended_actions: [
      { id: 'add-csp', label: 'Add CSP header' }
    ]
  },
  {
    id: 8,
    title: 'Insecure Cookie Flags',
    short_description: 'Session cookie missing HttpOnly and Secure flags.',
    area: 'backend',
    severity: 'medium',
    discovered_at: '2025-11-13T19:20:00.000Z',
    evidence: {
      cookie_name: 'sid',
      flags: []
    },
    recommended_actions: [
      { id: 'secure-cookie', label: 'Set HttpOnly and Secure flags' }
    ]
  },
  {
    id: 9,
    title: 'Hardcoded Credentials Found',
    short_description: 'App contains a hardcoded DB password in config.js.',
    area: 'code',
    severity: 'critical',
    discovered_at: '2025-11-12T06:10:00.000Z',
    evidence: {
      file: 'src/config.js',
      line: 42,
      snippet: "DB_PASS = 'P@ssw0rd123'"
    },
    recommended_actions: [
      { id: 'rotate', label: 'Rotate credentials' },
      { id: 'secrets', label: 'Use secrets manager' }
    ]
  },
  {
    id: 10,
    title: 'Deprecated API Version in Use',
    short_description: 'Client uses v1 of payments API which will be EOL.',
    area: 'backend',
    severity: 'low',
    discovered_at: '2025-11-11T09:00:00.000Z',
    evidence: {
      client: 'web-client',
      used_api: '/payments/v1/charge'
    },
    recommended_actions: [
      { id: 'upgrade', label: 'Migrate to payments v2' }
    ]
  },
  {
    id: 11,
    title: 'Open Port on DB Host',
    short_description: '3306 reachable from the internet on host db1.example.com.',
    area: 'infrastructure',
    severity: 'critical',
    discovered_at: '2025-11-10T13:55:00.000Z',
    evidence: {
      host: 'db1.example.com',
      open_ports: [22, 3306]
    },
    recommended_actions: [
      { id: 'restrict', label: 'Restrict inbound IPs' },
      { id: 'vpc', label: 'Move DB to private subnet' }
    ]
  },
  {
    id: 12,
    title: 'Excessive Login Attempts Observed',
    short_description: 'Brute-force attempts on /login from multiple IPs.',
    area: 'backend',
    severity: 'medium',
    discovered_at: '2025-11-09T03:30:00.000Z',
    evidence: {
      recent_attempts: [
        { ip: '45.78.12.1', attempts: 34, last: '2025-11-09T03:28:00Z' },
        { ip: '92.33.11.7', attempts: 27, last: '2025-11-09T03:29:00Z' }
      ]
    },
    recommended_actions: [
      { id: 'rate-limit', label: 'Add rate limiting' },
      { id: 'captcha', label: 'Add CAPTCHA' }
    ]
  }
];
