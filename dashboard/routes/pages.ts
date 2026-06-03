// dashboard/routes/pages.ts
// HTML page routes (server-side rendered)

import { Hono } from 'hono';
import { IndexPage } from '../views/index.js';
import { DetailPage } from '../views/detail.js';
import { Layout } from '../views/layout.js';
import { readSpec, readTemplate, searchCapabilities, getTagCounts } from '../../shared/capability-store.js';

export const pageRoutes = new Hono();

// GET / — capability list page
pageRoutes.get('/', (c) => {
  const tag = c.req.query('tag');
  const q = c.req.query('q');
  const capabilities = searchCapabilities(q || '', tag || undefined);
  const tagCounts = getTagCounts();
  const html = Layout({ title: 'Capability Library', children: IndexPage({ capabilities, tagCounts, activeTag: tag || '', query: q || '' }) });
  return c.html(html);
});

// GET /cap/:name — capability detail page
pageRoutes.get('/cap/:name', (c) => {
  const name = c.req.param('name');
  const spec = readSpec(name);
  if (!spec) {
    return c.html(Layout({ title: 'Not Found', children: `<h2>Capability "${name}" not found</h2><p><a href="/">← Back</a></p>` }), 404);
  }
  const template = readTemplate(name);
  const html = Layout({ title: spec.name, children: DetailPage({ spec, template: template || '' }) });
  return c.html(html);
});

// GET /static/styles.css
pageRoutes.get('/static/styles.css', (c) => {
  const fs = require('node:fs');
  const path = require('node:path');
  const cssPath = path.join(__dirname, '..', 'views', 'styles.css');
  const css = fs.readFileSync(cssPath, 'utf-8');
  return c.text(css, 200, { 'Content-Type': 'text/css' });
});
