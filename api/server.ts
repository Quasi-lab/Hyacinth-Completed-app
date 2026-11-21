// Re-exports the Express app from root server.ts so Vercel bundles it with the function.
// The actual server implementation lives in ../server.ts (used by local `tsx server.ts`).
export { app } from '../server';