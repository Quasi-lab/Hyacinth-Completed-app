import { app } from '../../server';

// Vercel routes /api/* to this function; Express handles /api/chat, /api/finals,
// /api/analytics, /api/seed-record, /api/health, etc. Importing server.ts here
// only registers routes — the `import.meta.main` guard in server.ts prevents
// startServer() from opening a listening port on serverless.
export default async function handler(req: any, res: any): Promise<void> {
  app(req, res);
}
