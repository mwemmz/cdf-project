import { createApp } from './app';
import { prisma } from './lib/prisma';

const app = createApp();

const port = Number(process.env.PORT ?? 4000);

async function main() {
  await prisma.$connect();
  app.listen(port, () => {
    console.log(`FundPath API listening on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});