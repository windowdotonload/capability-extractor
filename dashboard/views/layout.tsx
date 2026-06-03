// dashboard/views/layout.tsx
// Shared HTML layout wrapper

export function Layout({ title, children }: { title: string; children: string }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Capability Extractor</title>
  <link rel="stylesheet" href="/static/styles.css">
</head>
<body>
  <header class="app-header">
    <div class="container">
      <a href="/" class="logo">🧩 Capability Extractor</a>
      <nav>
        <a href="/">Library</a>
        <span class="nav-hint">~/.claude/capabilities</span>
      </nav>
    </div>
  </header>
  <main class="container">
    ${children}
  </main>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
