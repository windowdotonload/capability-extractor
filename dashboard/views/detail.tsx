// dashboard/views/detail.tsx
// Capability detail page

import type { CapabilitySpec } from '../../shared/types.js';

interface DetailProps {
  spec: CapabilitySpec;
  template: string;
}

export function DetailPage({ spec, template }: DetailProps): string {
  const apiList = spec.apis?.map(api => `
    <div class="api-item">
      <h4>${escapeHtml(api.name)}</h4>
      <p class="api-desc">${escapeHtml(api.description)}</p>
      <div class="api-type">Type: ${escapeHtml(api.type)}</div>
      ${api.params?.length ? `
      <table class="params-table">
        <thead><tr><th>Param</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          ${api.params.map(p => `
            <tr>
              <td><code>${escapeHtml(p.name)}</code></td>
              <td><code>${escapeHtml(p.type)}</code></td>
              <td>${p.required ? '✅' : '❌'}</td>
              <td>${escapeHtml(p.description)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>` : ''}
      <div class="api-returns"><strong>Returns:</strong> <code>${escapeHtml(api.returns.type)}</code> — ${escapeHtml(api.returns.description)}</div>
    </div>
  `).join('') || '<p>No API definitions</p>';

  const stepList = spec.steps?.map(step => `
    <div class="step-item">
      <div class="step-number">${step.step}</div>
      <div class="step-body">
        <h4>${escapeHtml(step.title)}</h4>
        <p>${escapeHtml(step.description)}</p>
        ${step.code_ref ? `<div class="step-code-ref">📄 ${escapeHtml(step.code_ref)}</div>` : ''}
        ${step.caveat ? `<div class="step-caveat">⚠️ ${escapeHtml(step.caveat)}</div>` : ''}
      </div>
    </div>
  `).join('') || '<p>No steps defined</p>';

  const caveatList = spec.caveats?.map(c => `
    <div class="caveat-item">
      <strong>⚠️ ${escapeHtml(c.title)}</strong>
      <p>${escapeHtml(c.description)}</p>
    </div>
  `).join('') || '';

  const whenToUseList = spec.when_to_use?.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '';
  const whenNotToUseList = spec.when_not_to_use?.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '';

  const codeLines = template.split('\n');
  const previewLines = codeLines.slice(0, 30);
  const hasMore = codeLines.length > 30;
  const codePreview = previewLines.map((line, i) =>
    `<span class="line-num">${i + 1}</span>${escapeHtml(line)}`
  ).join('\n');

  return `
    <div class="breadcrumb">
      <a href="/">← Library</a>
      <span>/</span>
      <span>${escapeHtml(spec.name)}</span>
    </div>

    <div class="detail-header">
      <h1>${escapeHtml(spec.name)}</h1>
      <span class="version-badge">v${escapeHtml(spec.version)}</span>
      <div class="detail-tags">
        ${spec.tags?.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('') || ''}
      </div>
      <div class="detail-meta">
        Extracted from <strong>${escapeHtml(spec.extracted_from?.project || 'Unknown')}</strong> on ${escapeHtml(spec.extracted_from?.date || 'Unknown')}
      </div>
    </div>

    <div class="detail-actions">
      <button class="btn-primary" onclick="openIntegrateModal('${escapeHtml(spec.name)}')">📥 Integrate into Project</button>
      <button class="btn-secondary" onclick="exportCapability('${escapeHtml(spec.name)}')">📤 Export</button>
      <button class="btn-danger" onclick="deleteCapabilityConfirm('${escapeHtml(spec.name)}')">🗑 Delete</button>
    </div>

    <section class="detail-section">
      <h2>Overview</h2>
      <p>${escapeHtml(spec.description || '')}</p>
      <blockquote class="principle">${escapeHtml(spec.principle || '')}</blockquote>
    </section>

    <section class="detail-section">
      <h2>When to Use</h2>
      <ul>${whenToUseList}</ul>
      ${whenNotToUseList ? `<h3 class="section-sub">When NOT to Use</h3><ul>${whenNotToUseList}</ul>` : ''}
    </section>

    <section class="detail-section">
      <h2>API Definitions</h2>
      <div class="api-list">${apiList}</div>
    </section>

    <section class="detail-section">
      <h2>Implementation Steps</h2>
      <div class="step-list">${stepList}</div>
    </section>

    <section class="detail-section">
      <h2>Reference Code</h2>
      ${template ? `
      <div class="code-block">
        <pre><code>${codePreview}${hasMore ? `\n<span class="dim">... ${codeLines.length - 30} more lines</span>` : ''}</code></pre>
      </div>
      <button class="btn-secondary" onclick="copyCode()">📋 Copy Code</button>` : '<p>No code template available</p>'}
    </section>

    ${caveatList ? `
    <section class="detail-section">
      <h2>Caveats</h2>
      <div class="caveat-list">${caveatList}</div>
    </section>` : ''}

    ${spec.dependencies ? `
    <section class="detail-section">
      <h2>Dependencies</h2>
      <div class="dep-list">
        ${spec.dependencies.runtime?.length ? `<div><strong>Runtime:</strong> ${spec.dependencies.runtime.join(', ')}</div>` : ''}
        ${spec.dependencies.npm?.length ? `<div><strong>npm:</strong> ${spec.dependencies.npm.map((d: string) => `<code>${escapeHtml(d)}</code>`).join(', ')}</div>` : ''}
        ${spec.dependencies.dev?.length ? `<div><strong>Dev:</strong> ${spec.dependencies.dev.join(', ')}</div>` : ''}
      </div>
    </section>` : ''}

    <!-- Integrate Modal -->
    <div id="integrate-modal" class="modal" style="display:none">
      <div class="modal-content">
        <h3>Integrate "${escapeHtml(spec.name)}"</h3>
        <label>Target Project Path:</label>
        <input type="text" id="target-path" class="search-input" placeholder="/path/to/your/project">
        <div class="modal-actions">
          <button class="btn-primary" onclick="executeIntegration('${escapeHtml(spec.name)}')">Integrate</button>
          <button class="btn-secondary" onclick="closeIntegrateModal()">Cancel</button>
        </div>
        <div id="integrate-result" style="margin-top:12px"></div>
      </div>
    </div>

    <script>
    function openIntegrateModal(name) {
      document.getElementById('integrate-modal').style.display = 'flex';
    }
    function closeIntegrateModal() {
      document.getElementById('integrate-modal').style.display = 'none';
      document.getElementById('integrate-result').innerHTML = '';
    }
    async function executeIntegration(name) {
      const target = document.getElementById('target-path').value;
      const resultDiv = document.getElementById('integrate-result');
      resultDiv.innerHTML = '<p>Integrating...</p>';
      try {
        const res = await fetch('/api/capabilities/' + name + '/integrate', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({targetProject: target})
        });
        const data = await res.json();
        if (data.success) {
          resultDiv.innerHTML = '<div class="success-box">✅ Integration complete!<br>Files added: ' + data.filesAdded.join(', ') + '<br>Manual steps: ' + data.manualSteps.join('; ') + '</div>';
        } else {
          resultDiv.innerHTML = '<div class="error-box">❌ Integration failed: ' + (data.error || data.errors?.join(', ')) + '</div>';
        }
      } catch(e) {
        resultDiv.innerHTML = '<div class="error-box">❌ Error: ' + e.message + '</div>';
      }
    }
    async function deleteCapabilityConfirm(name) {
      if (confirm('Delete "' + name + '"? This cannot be undone.')) {
        await fetch('/api/capabilities/' + name, {method: 'DELETE'});
        window.location.href = '/';
      }
    }
    async function exportCapability(name) {
      const res = await fetch('/api/export/' + name);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name + '.json'; a.click();
      URL.revokeObjectURL(url);
    }
    function copyCode() {
      const code = document.querySelector('.code-block code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = event.target;
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = '📋 Copy Code', 2000);
      });
    }
    </script>
  `;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
