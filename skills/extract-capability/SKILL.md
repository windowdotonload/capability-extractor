---
name: extract-capability
description: Use when the user wants to extract a reusable coding pattern or capability from the current session or an existing project — triggered by /extract-capability command, or when AI identifies a pattern worth preserving for future reuse across unrelated projects
---

# Extract Capability

## Overview

Extract reusable coding patterns from a session or existing project into a structured, AI-actionable YAML spec. The spec includes typed API definitions, implementation steps, reference code, and an integration script for one-click reuse in future projects.

## When to Use

- User runs `/extract-capability` or `/extract-capability --from <path>`
- User says "extract this as a capability" or "save this pattern for later"
- AI identifies a pattern that could be reused in future unrelated projects
- After completing a feature that solves a generic problem

**Do NOT use for:**
- Project-specific business logic that won't generalize
- Standard library usage already well-documented
- One-off configuration or deployment scripts

## Core Workflow

### Mode A: Extract from Current Session

When user runs `/extract-capability` (no `--from` flag):

1. **Scan the conversation context** — review what was built in this session. Identify patterns that solve generic problems (API interception, data streaming, reconnection, rate-limiting, etc.)

2. **Present candidates** — list the extractable capabilities you found:
   ```
   I found these extractable capabilities:
   1. Blob视频下载 — intercepts MediaSource API to capture blob videos
   2. WebSocket心跳保活 — auto-reconnect with exponential backoff
   Which should I extract? (or "all")
   ```

3. **For each selected capability, execute the extraction pipeline** (see below).

### Mode B: Extract from Existing Project

When user runs `/extract-capability --from <project-path>`:

1. **Scan the project** — list files, read key source files, understand what the project does.

2. **Identify reusable patterns** — look for generic mechanisms (not project-specific UI/business logic).

3. **Present candidates** — same as Mode A.

4. **Extract** — run the extraction pipeline.

### Extraction Pipeline

For each capability to extract:

**Step 1 — Identify the core mechanism:**
Find the key code that implements the capability. What API calls, event listeners, or algorithms make it work?

**Step 2 — Abstract from project specifics:**
Replace project-specific names, URLs, and values with generic placeholders. Generalize the implementation.

**Step 3 — Write spec.yaml:**
Create `~/.claude/capabilities/<capability-name>/spec.yaml` following this exact structure:

```yaml
name: <kebab-case-name>
version: "1.0.0"
description: >
  <one-paragraph summary>

tags:
  - <tag1>
  - <tag2>

extracted_from:
  project: <source-project>
  path: <source-path>
  date: <today's date>

when_to_use:
  - <concrete scenario description>

when_not_to_use:
  - <when not applicable>

principle: >
  <1-2 sentence explanation of core mechanism>

apis:
  - name: <methodName>
    description: <what it does>
    type: utility
    params:
      - name: <param>
        type: <TypeScript type>
        required: true
        description: <what it is>
    returns:
      type: <return type>
      description: <what it returns>

types:
  <OptionType>:
    <field>:
      type: <ts-type>
      default: <default>
      description: <what it is>

steps:
  - step: 1
    title: <action>
    description: <what to do>
    code_ref: template.ts#L1-L20
    api: <referenced method>

dependencies:
  runtime: []
  dev: []
  npm: []

caveats:
  - title: <gotcha>
    description: <detail>
```

**Step 4 — Extract code template:**
Write `~/.claude/capabilities/<capability-name>/template.ts` — the generalized, ready-to-adapt implementation. Remove hardcoded values, add comments explaining what to customize.

**Step 5 — Write integration script:**
Write `~/.claude/capabilities/<capability-name>/integrate.ts` — define how this capability is injected into a new project:

```typescript
export default {
  name: "<capability-name>",
  version: "1.0.0",

  compatibility: {
    projectTypes: ["<chrome-extension|node|react|...>"],
    check(targetProject: string): boolean {
      // Verify target project is compatible
      const fs = require('node:fs');
      const path = require('node:path');
      // e.g., check for manifest.json, package.json, etc.
      return true; // or false if incompatible
    },
  },

  files: [
    {
      source: "template.ts",
      target: "src/utils/<suggested-filename>.ts",
      transform: "copy",
    },
  ],

  configMerges: [
    {
      file: "<config-file>",
      strategy: "deep-merge",
      entries: {
        // config to merge
      },
    },
  ],

  dependencies: {
    install: [],
  },

  postInstall: {
    message: "Capability integrated successfully.",
    manualSteps: [
      "Update configuration with your specific values",
    ],
  },
};
```

**Step 6 — Report:**
```
Extracting "<capability-name>"...
✅ spec.yaml created
✅ template.ts extracted (N lines, generalized)
✅ integrate.ts created (<project-type> compatible)
Tags: [<tag-list>]
Saved to: ~/.claude/capabilities/<name>/
```

## Capability Data Location

All capabilities are stored in `~/.claude/capabilities/` (or `$CAPABILITIES_DIR` if set). Each capability is a subdirectory:

```
~/.claude/capabilities/<name>/
├── spec.yaml      # Structured YAML definition
├── template.ts    # Reusable code template
└── integrate.ts   # Integration script
```

## Tagging Guidelines

- Use lowercase, hyphen-separated tags
- Include: technology domain (browser-extension, node, react), mechanism (blob, websocket, api), and function (video-download, reconnect, rate-limit)
- 3-7 tags per capability
- Common tags: browser-extension, chrome-api, node, react, blob, websocket, media-capture, api, auth, database, queue, cache, rate-limit, reconnect

## Common Mistakes

- **Too project-specific:** A capability should work in ANY project with the same need, not just the original project.
- **Missing type definitions:** Spec APIs must have typed params and returns — AI needs types to implement correctly.
- **Vague steps:** Each step must be concrete enough that an AI can execute it without guessing.
- **No integration script:** Without `integrate.ts`, the capability can only be manually copied, defeating the purpose.
