import { z } from 'zod';

// Validate required environment variables at startup
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
  GITHUB_WEBHOOK_SECRET: z.string().min(1, 'GITHUB_WEBHOOK_SECRET is required'),
  GITHUB_TOKEN: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  AI_SERVICE_URL: z.string().default('http://localhost:8000'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  STRIPE_STARTER_PRICE_ID: z.string().min(1, 'STRIPE_STARTER_PRICE_ID is required'),
  STRIPE_PRO_PRICE_ID: z.string().min(1, 'STRIPE_PRO_PRICE_ID is required'),
  STRIPE_ENTERPRISE_PRICE_ID: z.string().min(1, 'STRIPE_ENTERPRISE_PRICE_ID is required'),
});

// Parse and validate; throws on missing required vars
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _env.data;
