# 🧩 Capability Extractor

> A Claude Code plugin that transforms coding knowledge into reusable, AI-actionable specs — with a local dashboard for browsing and one-click integration.

## What is this?

Capability Extractor solves a common problem: during a coding session, you implement a generic solution (like intercepting Blob URLs to download videos, or WebSocket auto-reconnect with exponential backoff), but once the session ends, that knowledge disappears. In a future project with the same need, the AI has no memory of the prior solution.

This plugin **extracts** generic capabilities into structured YAML specs with reusable code templates and integration scripts. A **local Hono dashboard** lets you browse, search, and one-click inject capabilities into new projects.

## How it Works

```
Encoding Session                      Future Project
     │                                      │
     │  /extract-capability                 │  /integrate-capability
     ▼                                      ▼
┌─────────────────┐                 ┌─────────────────┐
│ Extract Pattern │                 │ Inject Code     │
│ → spec.yaml     │────────────────▶│ → copy files    │
│ → template.ts   │  Capability     │ → merge config  │
│ → integrate.ts  │  Knowledge      │ → install deps  │
└─────────────────┘  Base           └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │ Hono Dashboard  │
                    │ :58288          │
                    │ Browse/Search/  │
                    │ Integrate       │
                    └─────────────────┘
```

## Skills Included

| Skill | Trigger | Description |
|-------|---------|-------------|
| `extract-capability` | `/extract-capability [--from <path>]` | Extract reusable patterns from current session or existing project |
| `browse-capabilities` | `/browse-capabilities [--tag <tag>] [--search <q>]` | Open dashboard in browser, search capabilities |
| `integrate-capability` | `/integrate-capability <name> --to <path>` | Inject a saved capability into a target project |

## Installation

```bash
# Clone to Claude Code skills directory
git clone https://github.com/windowdotonload/capability-extractor.git \
  ~/.claude/skills/capability-extractor

# Install dependencies
cd ~/.claude/skills/capability-extractor
npm install

# Restart Claude Code (or run /reload-plugins)
```

After installation, the plugin auto-loads as `capability-extractor@skills-dir`. The dashboard auto-starts on session start at `http://localhost:58288`.

## Usage

### 1. Extract a Capability

**From current session** — after building something reusable:

```
/extract-capability
```

The AI scans the conversation context, identifies reusable patterns, and asks which to extract:

```
I found these extractable capabilities:
1. Blob Video Download — intercepts MediaSource API to capture blob videos
2. WebSocket Keep-Alive — auto-reconnect with exponential backoff
Which should I extract? (or "all")
```

**From an existing project** — analyze and extract from any codebase:

```
/extract-capability --from ~/projects/my-chrome-extension
```

The AI scans the project, identifies generic mechanisms, and extracts them.

**What gets created** (in `~/.claude/capabilities/<name>/`):

```
capabilities/blob-video-download/
├── spec.yaml      # Structured YAML: what, how, APIs, steps, caveats
├── template.ts    # Generalized reusable code
└── integrate.ts   # Auto-integration rules (compatibility, file placement, config merge)
```

### 2. Browse Capabilities (Dashboard)

```
/browse-capabilities
```

This **automatically opens your browser** to `http://localhost:58288` showing:

- 📋 **List view** — all capabilities with tag filtering and full-text search
- 🔍 **Detail view** — full spec, typed APIs, implementation steps, code preview
- 📥 **One-click integrate** — modal to input target project path, execute integration

**Dashboard API** (also accessible programmatically):

```bash
# List all capabilities
curl http://localhost:58288/api/capabilities

# Search by tag
curl "http://localhost:58288/api/capabilities?tag=browser-extension"

# Search by keyword
curl "http://localhost:58288/api/capabilities?q=blob"

# Get full spec
curl http://localhost:58288/api/capabilities/blob-video-download

# Export as JSON
curl http://localhost:58288/api/export/blob-video-download

# One-click integrate
curl -X POST http://localhost:58288/api/capabilities/blob-video-download/integrate \
  -H "Content-Type: application/json" \
  -d '{"targetProject": "/path/to/my-project"}'
```

### 3. Integrate a Capability

```
/integrate-capability blob-video-download --to ./my-chrome-extension
```

The AI reads the capability's `integrate.ts`, analyzes the target project, presents an integration plan:

```
Integration Plan for "blob-video-download" → ./my-project

Files to add:
  ✅ Create: src/utils/blob-download.ts

Config to modify:
  ✅ Merge into manifest.json: add content_scripts entry

Dependencies to install:
  ✅ None

Manual steps after integration:
  ⚠️ Update content_scripts.matches to your target domain

Proceed? (yes/no)
```

After confirmation, the AI executes the integration automatically — copying files, merging configs, and installing dependencies.

## Capability Spec Format (spec.yaml)

Each capability is defined in a structured YAML format, making it **AI-actionable** — future Claude instances can read and implement it without additional context:

```yaml
name: blob-video-download
version: "1.0.0"
description: >
  Intercept blob URLs from MediaSource API and download complete videos.

tags:
  - blob
  - video-download
  - browser-extension
  - media-capture

# When to use (and when NOT to)
when_to_use:
  - Website uses MSE to dynamically load videos
when_not_to_use:
  - Website uses DRM (Encrypted Media Extensions)

# Core mechanism
principle: >
  Inject content script at document_start wrapping MediaSource constructor.
  Hook SourceBuffer.appendBuffer to accumulate ArrayBuffer chunks.
  Concatenate and trigger download via Blob + createObjectURL.

# Typed API definitions (AI uses these to implement)
apis:
  - name: interceptMediaSource
    description: Hook MediaSource constructor to intercept SourceBuffer creation
    type: content-script-injection
    params:
      - name: onSourceBufferCreated
        type: "(sourceBuffer: SourceBuffer, mediaSource: MediaSource) => void"
        required: true
    returns:
      type: "() => void"
      description: Cleanup function to restore original MediaSource

# Custom types used by APIs
types:
  DownloadOptions:
    filename:
      type: string
      default: '"video.mp4"'
      description: Downloaded file name
    mimeType:
      type: string
      default: '"video/mp4"'

# Step-by-step implementation guide
steps:
  - step: 1
    title: Configure content script injection
    description: Add content_scripts entry in manifest.json matching target site
    code_ref: template.ts#L1-L35
    caveat: Must run at document_start to intercept before page scripts execute

# Dependencies required
dependencies:
  runtime:
    - chrome-extension-api: ">=manifest-v3"
  npm: []

# Known gotchas
caveats:
  - title: Injection timing is critical
    description: Content scripts must run at document_start
  - title: Memory usage for long videos
    description: For videos over 500MB, write chunks to IndexedDB
```

## Use Cases

### Scenario 1: Extracting from Existing Project

You built a Chrome extension to download Xiaohongshu videos. The implementation involved intercepting `MediaSource.addSourceBuffer()`, collecting `appendBuffer` chunks, and concatenating them for download.

1. Point the extractor at your project:
   ```
   /extract-capability --from ~/projects/xiaohongshu-downloader
   ```
2. AI identifies the Blob download mechanism as a reusable pattern
3. Generates `blob-video-download` capability with:
   - `spec.yaml` — typed API definitions (interceptMediaSource, createChunkCollector, buildAndDownload)
   - `template.ts` — generalized code ready for any website using MSE
   - `integrate.ts` — Chrome extension integration rules (manifest merging)

### Scenario 2: Integrating into a New Project

A month later, you're building a YouTube Shorts downloader. The same Blob interception pattern applies.

1. Browse capabilities:
   ```
   /browse-capabilities
   ```
2. Dashboard opens → find `blob-video-download` → click "Integrate"
3. Enter target path `./youtube-shorts-plugin`
4. Integration executes:
   - `template.ts` → `src/utils/blob-download.ts`
   - `manifest.json` ← content_scripts entry merged
   - Done in one click

### Scenario 3: Dashboard Browsing

You wonder "what capabilities do we have for handling API rate limits?"

```
/browse-capabilities --search rate-limit
```

Dashboard shows `api-rate-limiter` — token bucket algorithm with 429 retry queue. Click to view full spec, APIs, code template, and caveats. Click "Integrate" to add it to your current project.

## Pre-Built Capabilities

The plugin ships with 3 example capabilities:

| Capability | Tags | What it does |
|-----------|------|--------------|
| `blob-video-download` | blob, video-download, browser-extension, media-capture | Intercept MediaSource API on streaming sites and download complete videos |
| `websocket-reconnect` | websocket, reconnect, network, resilience | Auto-reconnect WebSocket with exponential backoff, jitter, and heartbeat |
| `api-rate-limiter` | api, rate-limit, queue, resilience | Token bucket rate limiter with concurrent request queue and 429 auto-retry |

These live in `~/.claude/capabilities/` and are visible in the dashboard immediately after installation.

## Architecture

```
capability-extractor/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/
│   ├── extract-capability/
│   │   └── SKILL.md             # Extraction workflow
│   ├── integrate-capability/
│   │   └── SKILL.md             # Integration workflow
│   └── browse-capabilities/
│       └── SKILL.md             # Dashboard + browser launch
├── shared/
│   ├── types.ts                 # TypeScript type definitions
│   ├── capability-store.ts      # CRUD for ~/.claude/capabilities/
│   ├── tag-utils.ts             # Tag search/autocomplete
│   └── spec-template.yaml       # Base template for new specs
├── dashboard/
│   ├── server.ts                # Hono entry point (port 58288)
│   ├── routes/
│   │   ├── api.ts               # REST API routes
│   │   └── pages.ts             # HTML page routes
│   └── views/
│       ├── layout.tsx            # Page layout
│       ├── index.tsx             # Capability list
│       ├── detail.tsx            # Capability detail + integrate modal
│       └── styles.css            # Dark theme CSS
├── hooks/
│   ├── hooks.json               # SessionStart → auto-start dashboard
│   └── run-hook.cmd             # Windows hook runner
├── SKILL.md                     # Plugin-level skill description
├── package.json
└── tsconfig.json
```

### Data Location

Capability data is stored **outside the plugin** to survive updates:

```
~/.claude/capabilities/          # User data directory
├── blob-video-download/
│   ├── spec.yaml
│   ├── template.ts
│   └── integrate.ts
├── websocket-reconnect/
│   └── ...
└── api-rate-limiter/
    └── ...
```

Configurable via `$CAPABILITIES_DIR` environment variable.

## Requirements

- **Claude Code** (any recent version)
- **Node.js** ≥ 18
- **npm** ≥ 9

## License

MIT

## Related

- [AgentSkills.io Specification](https://agentskills.io/specification) — Skill file format
- [Claude Code Plugins](https://docs.anthropic.com/en/docs/claude-code/plugins) — Plugin system documentation
