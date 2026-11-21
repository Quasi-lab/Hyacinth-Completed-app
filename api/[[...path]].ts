import { app } from './server';

// Vercel routes /api/* to this function; Express handles /api/chat, /api/finals,
// /api/analytics, /api/seed-record, /api/health, etc.
export default async function handler(req: any, res: any): Promise<void> {
  app(req, res);
}