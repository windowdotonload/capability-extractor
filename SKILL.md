---
name: capability-extractor
description: Use when the user wants to extract reusable coding patterns into a knowledge base, integrate a saved capability into a project, or browse previously extracted capabilities. Triggered by phrases like "extract this as a capability", "save this pattern", "integrate the X capability", "what capabilities do we have", or the /extract-capability, /integrate-capability, /browse-capabilities commands.
---

# Capability Extractor

Extract reusable coding capabilities into structured YAML specs with code templates and integration scripts. Browse and one-click integrate via a local Hono dashboard.

## Skills Included

- **extract-capability** — Extract reusable patterns from current session or existing project into `~/.claude/capabilities/`
- **integrate-capability** — Inject a saved capability into a target project with automatic file placement and config merging
- **browse-capabilities** — List, search, and view capabilities from the knowledge base

## Dashboard

A Hono-powered local dashboard runs at `http://localhost:58288` providing a web UI to browse, search, and integrate capabilities.

## Data Location

All capabilities are stored in `~/.claude/capabilities/` (configurable via `$CAPABILITIES_DIR`).
