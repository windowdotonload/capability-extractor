---
name: integrate-capability
description: Use when the user wants to inject a previously extracted capability into a new project — triggered by /integrate-capability command, or when user asks to "add the X capability to my project"
---

# Integrate Capability

## Overview

Inject a previously extracted capability into a target project. Reads the capability's spec.yaml and integrate.ts, analyzes the target project, presents an integration plan for user approval, then executes the integration automatically.

## When to Use

- User runs `/integrate-capability <name> --to <target-path>`
- User says "add blob download capability to my chrome extension"
- User clicks "Integrate" in the Hono dashboard
- After browsing capabilities, user wants to use one in their current project

## Core Workflow

### Step 1: Read the Capability

Read from `~/.claude/capabilities/<name>/`:
- `spec.yaml` — what the capability does, what it needs
- `template.ts` — the reusable code
- `integrate.ts` — integration rules (compatibility, file placement, config merges)

Use the Bash tool to read these files:
```bash
cat ~/.claude/capabilities/<name>/spec.yaml
cat ~/.claude/capabilities/<name>/template.ts
cat ~/.claude/capabilities/<name>/integrate.ts
```

### Step 2: Analyze Target Project

Scan the target project directory:
```bash
ls <target-project>/
```

Identify:
- Project type (Chrome extension? Node package? React app?)
- Directory structure (where does source code live?)
- Existing config files (package.json, manifest.json, tsconfig.json, etc.)
- Current dependencies

### Step 3: Run Compatibility Check

Based on `integrate.ts`'s `compatibility` rules:
- Check `projectTypes` match the detected project type
- Run `check(targetProject)` function if defined
- If incompatible, explain why and suggest alternatives

### Step 4: Present Integration Plan

Show the user exactly what will happen:

```
Integration Plan for "blob-video-download" → ./my-project

Files to add:
  ✅ Create: src/utils/blob-download.ts (from template.ts)

Config to modify:
  ✅ Merge into manifest.json: add content_scripts entry

Dependencies to install:
  ✅ None (no additional npm packages)

Manual steps after integration:
  ⚠️ Update content_scripts.matches to your target domain
  ⚠️ Reload Chrome extension

Proceed? (yes/no)
```

### Step 5: Execute Integration

After user confirms:

**Copy files:** For each file in `integrate.ts`'s `files` array:
- `copy`: Copy `source` → `target` in target project
- `merge`: If target file exists, merge content intelligently (for TypeScript: append export)
- `template`: Process template variables before writing

**Merge config:** For each entry in `configMerges`:
- `deep-merge`: Recursively merge JSON objects
- `append`: Add to array fields
- `replace`: Replace the entire config section

Use the Edit tool or Write tool as appropriate.

**Install dependencies:** If `dependencies.install` has entries:
```bash
cd <target-project> && npm install <packages>
```

### Step 6: Report Results

```
✅ Integration complete: blob-video-download → ./my-project

Files added:
  ✅ src/utils/blob-download.ts

Config modified:
  ✅ manifest.json — added content_scripts[blob-download]

Dependencies:
  ✅ No new dependencies

Manual steps:
  ⚠️ Edit src/utils/blob-download.ts: update target URL matches
  ⚠️ Reload Chrome extension to apply changes
```

## Error Handling

| Scenario | Handling |
|----------|----------|
| Capability not found | List available capabilities |
| Incompatible project type | Show required vs detected type |
| Target file already exists | Ask user: skip, overwrite, or merge |
| Config merge conflict | Show diff, ask user to choose |
| npm install fails | Show error output, mark as manual step |

## Common Mistakes

- **Not checking compatibility first:** Always check before modifying files
- **Blind overwrite:** Ask before overwriting existing files
- **Skipping manual steps:** Always report what the user needs to do after integration
- **Wrong file paths:** Verify the target project structure before placing files
