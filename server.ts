// Local development server — imports the Express app from the Vercel function file,
// adds Vite middleware in dev, and starts listening.
import express from 'express';
import { app } from './api/[[...path]]';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const httpServer = http.createServer(app);

  // Cross-platform production switch: `NODE_ENV=production` fails inline on Windows,
  // so `tsx server.ts --prod` is also accepted.
  const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--prod');

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'app/web/dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'app/web/dist', 'index.html'));
    });
  } else {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      root: path.resolve(__dirname, 'app/web'),
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Hyacinth Clinic server running on http://localhost:${PORT}`);
  });
}

// Only start listening when run directly (`tsx server.ts`).
if (import.meta.main) {
  startServer();
}