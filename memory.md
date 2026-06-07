# Memory — Phase 12: Conflict Banner, Border Token Fix, Review

Last updated: 2026-06-07

## What was built

### Conflict Banner (VaultShell.tsx)
- Persistent amber banner below the header when `hasConflict` is true: amber left border, `AlertTriangle` icon, "Sync conflict detected — a conflicted copy of your vault exists", "Resolve" button opens Settings.
- Removed conflict icon from the top bar header — banner is more visible and matches the first-run warning pattern.
- Fixed hardcoded inline `borderLeftColor: '#C4840A'` to Tailwind class `border-l-4 border-status-warning`.

### Border token fix
- Found and fixed the `border-subtle` naming issue: the Tailwind `border` color group conflicts with the `border` width utility class. All instances use `border-border-subtle`, `border-border`, `border-border-strong` pattern.
- Confirmed by grepping compiled CSS.

### Review
- `/review` ran clean: 0 issues found. Banner follows design tokens, matches ui-rules.md patterns (first-run warning callout), no security boundary violations.

## Decisions made

- **Conflict banner matches first-run warning pattern**: Same amber left border, `bg-surface-raised`, `text-status-warning` — consistent with LockScreen's warning callout pattern.
- **"Resolve" opens Settings** until Phase 13 builds the dedicated resolution dialog.

## Problems solved

- **`border-status-warning` confirmed working**: Tailwind generates it correctly from `status: { warning: '#C4840A' }` in the config. Using it for both the banner's left border and the Resolve button styling.
- **Inline style → Tailwind class**: The banner's amber left border was initially hardcoded via `style={{ borderLeft: '4px solid', borderLeftColor: '#C4840A' }}`. Fixed to `border-l-4 border-status-warning` to obey the no-hardcoded-colors rule.

## Current state

- **Phase 12 sync** (simplified, one-path model): Complete.
- **Conflict banner**: Built, styled, wired. `npx tsc --noEmit`: 0 errors. `npx vite build`: clean. `cargo clippy -- -D warnings`: clean. `cargo test`: 28/28 pass.
- **ui-registry.md**: Updated with Conflict Banner entry. All 12 components now documented.

## Next session starts with

**Phase 13 — Conflict Resolution Dialog**: Build the dedicated resolution dialog. When user clicks "Resolve", instead of opening Settings, show a modal with:
- "Two versions of your vault exist" message
- Local timestamp vs sync (conflict) timestamp
- "Keep this device's version" and "Keep cloud version" buttons
- On choice: delete the other file, reload vault

## Open questions

- (none)
