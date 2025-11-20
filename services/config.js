const { z } = require('zod');

const schema = z.object({
  DATABASE_URL: z.string().nonempty(),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().optional(),
  NODE_ENV: z.enum(['development','production','test']).default('development')
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid env config', parsed.error.format());
  process.exit(1);
}

if (parsed.data.JWT_SECRET === 'dev-secret' && parsed.data.NODE_ENV === 'production') {
  console.error('Refuse to start with default dev JWT_SECRET in production');
  process.exit(1);
}

module.exports = parsed.data;
