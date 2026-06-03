// dashboard/server.ts
// Hono dashboard server — entry point

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as fs from 'node:fs';
import { apiRoutes } from './routes/api.js';
import { pageRoutes } from './routes/pages.js';
import { ensureCapabilitiesDir } from '../shared/capability-store.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/api', apiRoutes);
app.route('/', pageRoutes);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));

// Determine port
function getPort(): number {
  const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 58288;
  return isNaN(envPort) ? 58288 : envPort;
}

// Start server
function startServer(port: number): void {
  ensureCapabilitiesDir();

  serve({
    fetch: app.fetch,
    port,
    hostname: '127.0.0.1',
  }, (info) => {
    console.log(`[capability-extractor] Dashboard running at http://localhost:${info.port}`);
    // Write port info for hook discovery
    const stateDir = process.env.STATE_DIR || '';
    if (stateDir) {
      fs.mkdirSync(stateDir, { recursive: true });
      fs.writeFileSync(`${stateDir}/dashboard-info.json`, JSON.stringify({
        port: info.port,
        url: `http://localhost:${info.port}`,
      }));
    }
  });
}

// CLI entry
const args = process.argv.slice(2);
if (args.includes('--start') || args.includes('-s')) {
  const port = getPort();
  startServer(port);
} else if (args.includes('--stop') || args.includes('-x')) {
  console.log('[capability-extractor] Dashboard stop requested');
  process.exit(0);
} else {
  // Default: start
  const port = getPort();
  startServer(port);
}

export default app;
export { startServer, getPort };
