// shared/tag-utils.ts
// Tag search, matching, and indexing utilities

/** Parse a tag query string: "tag1 tag2" => ["tag1", "tag2"] */
export function parseTagQuery(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

/** Check if a capability's tags match all required tags */
export function matchesAllTags(capTags: string[], required: string[]): boolean {
  return required.every(r => capTags.some(t => t.toLowerCase() === r));
}

/** Check if a capability's tags match any of the required tags */
export function matchesAnyTag(capTags: string[], required: string[]): boolean {
  return required.some(r => capTags.some(t => t.toLowerCase() === r));
}

/** Autocomplete: find tags starting with prefix */
export function autocompleteTags(allTags: string[], prefix: string): string[] {
  const p = prefix.toLowerCase();
  return allTags.filter(t => t.toLowerCase().startsWith(p)).slice(0, 10);
}

/** Normalize a tag string (lowercase, trim, replace spaces with hyphens) */
export function normalizeTag(raw: string): string {
  return raw.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Validate tags against allowed characters */
export function isValidTag(tag: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(tag) || /^[a-z0-9]$/.test(tag);
}
