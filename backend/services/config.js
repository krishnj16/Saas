// backend/services/config.js
const { z } = require('zod');

if (process.env.NODE_ENV === 'test') {
  // ensure both names exist for code that expects different env var names
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/testdb';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  process.env.VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || 'test-vt-key';
  process.env.VT_API_KEY = process.env.VT_API_KEY || process.env.VIRUSTOTAL_API_KEY;
  process.env.NODE_ENV = 'test';
}

const schema = z.object({
  NODE_ENV: z.string(),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().optional(),
  CLIENT_ORIGIN: z.string().optional(),
  VIRUSTOTAL_API_KEY: z.string().optional(),
  VT_API_KEY: z.string().optional(),
  PORT: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

const config = {
  env: parsed.success ? parsed.data.NODE_ENV : process.env.NODE_ENV,
  DATABASE_URL: parsed.success ? parsed.data.DATABASE_URL : process.env.DATABASE_URL,
  JWT_SECRET: parsed.success ? parsed.data.JWT_SECRET : process.env.JWT_SECRET,
  CLIENT_ORIGIN: parsed.success ? parsed.data.CLIENT_ORIGIN : process.env.CLIENT_ORIGIN,
  VIRUSTOTAL_API_KEY: parsed.success ? parsed.data.VIRUSTOTAL_API_KEY : process.env.VIRUSTOTAL_API_KEY,
  VT_API_KEY: parsed.success ? parsed.data.VT_API_KEY : process.env.VT_API_KEY,
  PORT: parsed.success && parsed.data.PORT ? Number(parsed.data.PORT) : (process.env.PORT ? Number(process.env.PORT) : undefined),
};

module.exports = config;
