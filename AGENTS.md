# AGENTS.md — credvault

This file is read first by any AI coding agent. It defines the skills available in this project and how to use them.

---

## Skills

| Skill | When | Purpose |
|---|---|---|
| `/architect` | Before building any feature | Think through decisions before touching code |
| `/remember save` | End of every session | Compress session state into memory.md |
| `/remember restore` | Start of every session | Restore full context before continuing |
| `/review` | After building any feature | Verify correctness, not just that it works |
| `/recover` | When something breaks | Diagnose failure mode before attempting fixes |
| `/imprint` | After building any UI component | Capture visual patterns to ui-registry.md |

---

## Session Protocol

Every session follows this order:

1. Run `/remember restore` — load memory.md and all context files
2. Read `context/progress-tracker.md` — know exactly where things stand
3. Run `/architect` before starting any new feature
4. Build the feature
5. Run `/review` after completing the feature
6. Run `/imprint` after any UI component
7. Update `context/progress-tracker.md`
8. Run `/remember save` at end of session

Never skip steps 1 and 8. Context loss between sessions is the primary source of drift and bugs.

---

## Context Files

| File | Purpose |
|---|---|
| `context/project-overview.md` | What this is, who it's for, core user flows |
| `context/architecture.md` | Stack, folder structure, system boundaries, invariants |
| `context/build-plan.md` | Phased feature list — numbered, ordered, with sub-tasks |
| `context/progress-tracker.md` | Live checklist — what's done, in progress, next |
| `context/code-standards.md` | Naming, structure, error handling, patterns |
| `context/library-docs.md` | Project-specific usage patterns for every third-party library. Context7 is configured — fetch live docs automatically before using any library. |
| `context/ui-tokens.md` | Design tokens — all colors, spacing, typography. Never hardcode values. |
| `context/ui-rules.md` | Layout, component patterns, do-nots |
| `context/ui-registry.md` | Living record of built components — read before building any new one |

---

## Library Docs — Context7

This project has Context7 configured as an MCP server. Whenever you are about to write code that uses a third-party library, call the Context7 MCP tool first to resolve the library ID and fetch current documentation. Do this automatically — do not wait to be asked. Relying on training-data knowledge for library APIs leads to outdated patterns and bugs.

Workflow:
1. Resolve the library: `mcp__context7__resolve-library-id({ libraryName: "..." })`
2. Fetch the relevant docs: `mcp__context7__get-library-docs({ context7CompatibleLibraryId: "...", topic: "..." })`
3. Then write the code

---

## Order of Authority

```
memory.md + progress-tracker → architecture.md invariants → code-standards.md → library-docs.md → general knowledge
```

Never rely on general training knowledge for library APIs — they change. Always check library-docs.md and use Context7 to fetch live docs before using any library.

---

## Invariants

_See `context/architecture.md` — Invariants section._

