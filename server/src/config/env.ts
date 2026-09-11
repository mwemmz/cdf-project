import dotenv from 'dotenv';

dotenv.config();

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-only-secret-change-me',
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URL: process.env.CLIENT_URL ?? 'http://localhost:5173',
};