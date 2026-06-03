// dashboard/routes/api.ts
// REST API for capabilities CRUD and integration

import { Hono } from 'hono';
import {
  listSummaries,
  readSpec,
  writeSpec,
  readTemplate,
  writeTemplate,
  readIntegrateScript,
  writeIntegrateScript,
  deleteCapability,
  capabilityExists,
  getTagCounts,
  searchCapabilities,
} from '../../shared/capability-store.js';
import type { CapabilitySpec } from '../../shared/types.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const apiRoutes = new Hono();

// GET /api/capabilities — list all (with optional ?tag=&q=&sort=)
apiRoutes.get('/capabilities', (c) => {
  const tag = c.req.query('tag');
  const q = c.req.query('q');
  const sort = c.req.query('sort') || 'date';

  let results = searchCapabilities(q || '', tag || undefined);

  if (sort === 'name') {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // default: date descending
    results.sort((a, b) => b.date.localeCompare(a.date));
  }

  return c.json(results);
});

// GET /api/capabilities/:name — get single capability
apiRoutes.get('/capabilities/:name', (c) => {
  const name = c.req.param('name');
  const spec = readSpec(name);
  if (!spec) {
    return c.json({ error: `Capability "${name}" not found` }, 404);
  }
  const template = readTemplate(name);
  const integrateScript = readIntegrateScript(name);
  return c.json({
    ...spec,
    template,
    integrateScript,
  });
});

// POST /api/capabilities — create new capability
apiRoutes.post('/capabilities', async (c) => {
  const body = await c.req.json<CapabilitySpec & { template?: string; integrateScript?: string }>();
  if (!body.name) {
    return c.json({ error: 'name is required' }, 400);
  }
  if (capabilityExists(body.name)) {
    return c.json({ error: `Capability "${body.name}" already exists` }, 409);
  }
  const { template, integrateScript, ...spec } = body;
  writeSpec(body.name, spec as CapabilitySpec);
  if (template) writeTemplate(body.name, template);
  if (integrateScript) writeIntegrateScript(body.name, integrateScript);
  return c.json({ success: true, name: body.name }, 201);
});

// PUT /api/capabilities/:name — update capability
apiRoutes.put('/capabilities/:name', async (c) => {
  const name = c.req.param('name');
  if (!capabilityExists(name)) {
    return c.json({ error: `Capability "${name}" not found` }, 404);
  }
  const body = await c.req.json<CapabilitySpec & { template?: string; integrateScript?: string }>();
  const { template, integrateScript, ...spec } = body;
  writeSpec(name, spec as CapabilitySpec);
  if (template !== undefined) writeTemplate(name, template);
  if (integrateScript !== undefined) writeIntegrateScript(name, integrateScript);
  return c.json({ success: true, name });
});

// DELETE /api/capabilities/:name
apiRoutes.delete('/capabilities/:name', (c) => {
  const name = c.req.param('name');
  if (!deleteCapability(name)) {
    return c.json({ error: `Capability "${name}" not found` }, 404);
  }
  return c.json({ success: true, name });
});

// POST /api/capabilities/:name/integrate — execute integration
apiRoutes.post('/capabilities/:name/integrate', async (c) => {
  const name = c.req.param('name');
  const body = await c.req.json<{ targetProject: string }>();
  const targetProject = body.targetProject;

  if (!targetProject) {
    return c.json({ error: 'targetProject is required' }, 400);
  }
  if (!capabilityExists(name)) {
    return c.json({ error: `Capability "${name}" not found` }, 404);
  }
  if (!fs.existsSync(targetProject)) {
    return c.json({ error: `Target project "${targetProject}" does not exist` }, 400);
  }

  const capDir = process.env.CAPABILITIES_DIR || path.join(
    process.env.HOME || process.env.USERPROFILE || '', '.claude', 'capabilities'
  );
  const integratePath = path.join(capDir, name, 'integrate.ts');

  const result = {
    success: true,
    capability: name,
    targetProject,
    filesAdded: [] as string[],
    filesModified: [] as string[],
    dependenciesInstalled: [] as string[],
    errors: [] as string[],
    manualSteps: [] as string[],
  };

  try {
    // Dynamic import the integrate script
    const mod = await import(integratePath);
    const script = mod.default;

    // Run compatibility check
    if (script.compatibility?.check) {
      const compat = script.compatibility.check(targetProject);
      if (!compat) {
        return c.json({
          success: false,
          error: `Target project is not compatible. Required type: ${script.compatibility.projectTypes?.join(', ')}`,
        }, 400);
      }
    }

    // Copy files
    for (const file of script.files || []) {
      const src = path.join(capDir, name, file.source);
      const dest = path.join(targetProject, file.target);
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      result.filesAdded.push(file.target);
    }

    // Merge config
    for (const merge of script.configMerges || []) {
      const configPath = path.join(targetProject, merge.file);
      if (fs.existsSync(configPath)) {
        const existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const merged = deepMerge(existing, merge.entries);
        fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8');
        result.filesModified.push(merge.file);
      }
    }

    // Manual steps
    result.manualSteps = script.postInstall?.manualSteps || [];
  } catch (err: unknown) {
    result.errors.push(err instanceof Error ? err.message : String(err));
    result.success = false;
  }

  return c.json(result);
});

// GET /api/capabilities/:name/code — get template.ts
apiRoutes.get('/capabilities/:name/code', (c) => {
  const name = c.req.param('name');
  const code = readTemplate(name);
  if (code === null) {
    return c.json({ error: `Capability "${name}" not found or has no template` }, 404);
  }
  return c.text(code);
});

// GET /api/tags — get all tags with counts
apiRoutes.get('/tags', (c) => {
  const counts = getTagCounts();
  return c.json(counts);
});

// GET /api/export/:name — export as JSON bundle
apiRoutes.get('/export/:name', (c) => {
  const name = c.req.param('name');
  const spec = readSpec(name);
  if (!spec) {
    return c.json({ error: `Capability "${name}" not found` }, 404);
  }
  const template = readTemplate(name);
  const integrateScript = readIntegrateScript(name);
  return c.json({ spec, template, integrateScript });
});

// Simple deep merge utility
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
      result[key] = [...(target[key] as unknown[]), ...(source[key] as unknown[])];
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
