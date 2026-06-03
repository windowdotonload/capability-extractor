// dashboard/views/index.tsx
// Capability list page

import type { CapabilitySummary } from '../../shared/types.js';

interface IndexProps {
  capabilities: CapabilitySummary[];
  tagCounts: Record<string, number>;
  activeTag: string;
  query: string;
}

export function IndexPage({ capabilities, tagCounts, activeTag, query }: IndexProps): string {
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const tagChips = sortedTags.map(([tag, count]) => {
    const isActive = tag === activeTag;
    return `<a href="/?tag=${encodeURIComponent(tag)}" class="tag-chip ${isActive ? 'active' : ''}">${escapeHtml(tag)} <span class="tag-count">${count}</span></a>`;
  }).join('');

  const hasCapabilities = capabilities.length > 0;

  const cards = capabilities.map(cap => `
    <a href="/cap/${encodeURIComponent(cap.name)}" class="capability-card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(cap.name)}</h3>
        <span class="card-version">v${escapeHtml(cap.version)}</span>
      </div>
      <p class="card-desc">${escapeHtml(truncate(cap.description, 150))}</p>
      <div class="card-tags">
        ${cap.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="card-meta">
        <span>📅 ${escapeHtml(cap.date)}</span>
        <span>📂 ${escapeHtml(cap.extractedFrom)}</span>
      </div>
    </a>
  `).join('');

  const emptyState = `
    <div class="empty-state">
      <h2>📦 No capabilities yet</h2>
      <p>Extract your first capability using the Claude Code skill:</p>
      <div class="code-block">
        <code>/extract-capability</code>
        <span class="dim">from current session</span>
      </div>
      <div class="code-block">
        <code>/extract-capability --from &lt;path&gt;</code>
        <span class="dim">from existing project</span>
      </div>
    </div>
  `;

  return `
    <div class="page-header">
      <h1>Capability Library</h1>
      <p class="subtitle">${capabilities.length} capability${capabilities.length !== 1 ? 'ies' : ''} available</p>
    </div>

    <div class="search-bar">
      <form action="/" method="get">
        <input type="text" name="q" value="${escapeHtml(query)}" placeholder="Search capabilities..." class="search-input">
        ${activeTag ? `<input type="hidden" name="tag" value="${escapeHtml(activeTag)}">` : ''}
        <button type="submit" class="btn-primary">Search</button>
        ${query || activeTag ? `<a href="/" class="btn-link">Clear</a>` : ''}
      </form>
    </div>

    ${sortedTags.length > 0 ? `
    <div class="tag-filters">
      <span class="filter-label">Tags:</span>
      ${tagChips}
    </div>` : ''}

    <div class="capability-list">
      ${hasCapabilities ? cards : emptyState}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max).replace(/\s+\S*$/, '') + '...';
}
