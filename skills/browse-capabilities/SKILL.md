---
name: browse-capabilities
description: Use when the user wants to see what reusable capabilities are available, search by tag, or find a specific capability — triggered by /browse-capabilities command, or questions like "what capabilities do we have?" or "find the blob download capability"
---

# Browse Capabilities

## Overview

Browse and search the capability library through a local web dashboard at `http://localhost:58288`. The dashboard shows all capabilities with tag filtering, full-text search, and one-click integration.

## CRITICAL: Always Open the Browser Dashboard

**When this skill is invoked, you MUST open the browser to the dashboard.** This is the primary interface for browsing capabilities. Do NOT just list them in the terminal — use the dashboard.

## Workflow

### Step 1: Ensure the Dashboard is Running

Check if the dashboard server is already running:

```bash
curl -s http://localhost:58288/health
```

If you get `{"status":"ok"}`, the server is running. Skip to Step 2.

If the server is NOT running, start it:

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && CAPABILITIES_DIR="${HOME}/.claude/capabilities" npx tsx dashboard/server.ts --start &
```

Wait 2 seconds for the server to start, then verify:

```bash
sleep 2 && curl -s http://localhost:58288/health
```

### Step 2: Open the Browser

**MUST DO:** Open the user's default browser to the dashboard:

```bash
# Windows
start http://localhost:58288

# macOS
open http://localhost:58288

# Linux
xdg-open http://localhost:58288
```

Tell the user: "Opening the capability dashboard in your browser..."

### Step 3: Brief Terminal Summary

After opening the browser, give a quick terminal summary. List capabilities from the API:

```bash
curl -s http://localhost:58288/api/capabilities
```

Show a compact summary:
```
📦 Capability Dashboard opened at http://localhost:58288

Available: blob-video-download, websocket-reconnect, api-rate-limiter (3 total)

Use the dashboard to search, filter by tags, or integrate into projects.
```

### Search from Terminal (Optional)

If the user specifically asks to search from the terminal rather than the browser:

- `?tag=<tag>` → filter by tag: `curl -s "http://localhost:58288/api/capabilities?tag=resilience"`
- `?q=<query>` → full-text search: `curl -s "http://localhost:58288/api/capabilities?q=blob"`

## Data Location

All capabilities are stored in `~/.claude/capabilities/` (configurable via `$CAPABILITIES_DIR`). The dashboard reads directly from this directory.
