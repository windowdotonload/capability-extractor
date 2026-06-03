// shared/capability-store.ts
// Data layer for reading/writing capability directories

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as YAML from 'yaml';
import type { CapabilitySpec, CapabilitySummary, IntegrationScript } from './types.js';

/** Resolve the capabilities directory: $CAPABILITIES_DIR or ~/.claude/capabilities */
export function getCapabilitiesDir(): string {
  if (process.env.CAPABILITIES_DIR) {
    return process.env.CAPABILITIES_DIR;
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(home, '.claude', 'capabilities');
}

/** Ensure the capabilities directory exists */
export function ensureCapabilitiesDir(): string {
  const dir = getCapabilitiesDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/** List all capability names */
export function listCapabilityNames(): string[] {
  const dir = ensureCapabilitiesDir();
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();
}

/** Read a capability's spec.yaml */
export function readSpec(name: string): CapabilitySpec | null {
  const filePath = path.join(ensureCapabilitiesDir(), name, 'spec.yaml');
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return YAML.parse(raw) as CapabilitySpec;
}

/** Write a capability's spec.yaml */
export function writeSpec(name: string, spec: CapabilitySpec): void {
  const capDir = path.join(ensureCapabilitiesDir(), name);
  if (!fs.existsSync(capDir)) {
    fs.mkdirSync(capDir, { recursive: true });
  }
  const yamlStr = YAML.stringify(spec, { lineWidth: 120 });
  fs.writeFileSync(path.join(capDir, 'spec.yaml'), yamlStr, 'utf-8');
}

/** Read template.ts content */
export function readTemplate(name: string): string | null {
  const filePath = path.join(ensureCapabilitiesDir(), name, 'template.ts');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/** Write template.ts content */
export function writeTemplate(name: string, content: string): void {
  const capDir = path.join(ensureCapabilitiesDir(), name);
  if (!fs.existsSync(capDir)) {
    fs.mkdirSync(capDir, { recursive: true });
  }
  fs.writeFileSync(path.join(capDir, 'template.ts'), content, 'utf-8');
}

/** Read integrate.ts content */
export function readIntegrateScript(name: string): string | null {
  const filePath = path.join(ensureCapabilitiesDir(), name, 'integrate.ts');
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/** Write integrate.ts content */
export function writeIntegrateScript(name: string, content: string): void {
  const capDir = path.join(ensureCapabilitiesDir(), name);
  if (!fs.existsSync(capDir)) {
    fs.mkdirSync(capDir, { recursive: true });
  }
  fs.writeFileSync(path.join(capDir, 'integrate.ts'), content, 'utf-8');
}

/** Get all capability summaries (for list views) */
export function listSummaries(): CapabilitySummary[] {
  const names = listCapabilityNames();
  return names
    .map(name => {
      const spec = readSpec(name);
      if (!spec) return null;
      return {
        name: spec.name,
        version: spec.version,
        description: spec.description,
        tags: spec.tags,
        extractedFrom: spec.extracted_from.project,
        date: spec.extracted_from.date,
      };
    })
    .filter((s): s is CapabilitySummary => s !== null);
}

/** Delete a capability entirely */
export function deleteCapability(name: string): boolean {
  const capDir = path.join(ensureCapabilitiesDir(), name);
  if (!fs.existsSync(capDir)) return false;
  fs.rmSync(capDir, { recursive: true, force: true });
  return true;
}

/** Check if a capability exists */
export function capabilityExists(name: string): boolean {
  return fs.existsSync(path.join(ensureCapabilitiesDir(), name, 'spec.yaml'));
}

/** Get tag counts across all capabilities */
export function getTagCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const summary of listSummaries()) {
    for (const tag of summary.tags) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

/** Search capabilities by name, description, or tags */
export function searchCapabilities(query: string, tag?: string): CapabilitySummary[] {
  let results = listSummaries();
  const q = query.toLowerCase();
  if (q) {
    results = results.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (tag) {
    results = results.filter(s => s.tags.includes(tag));
  }
  return results;
}
