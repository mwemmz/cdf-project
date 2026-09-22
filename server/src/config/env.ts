import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) return missing(name);
  return value;
}

function missing(name: string): never {
  throw new Error(
    `Missing required environment variable ${name}. ` +
      'Copy server/.env.example to server/.env and fill in real values.',
  );
}

const jwtSecret = process.env.JWT_SECRET ?? '';
if (jwtSecret === '' || jwtSecret === 'change-me-to-a-long-random-string' || jwtSecret === 'dev-only-secret-change-me') {
  throw new Error(
    'Set a real JWT_SECRET in server/.env — refusing to sign tokens with a known placeholder value.',
  );
}

export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: jwtSecret,
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
};