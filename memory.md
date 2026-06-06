# Memory — 06 Entry List UI (completed)

Last updated: 2026-06-06

## What was built

- `src/components/EntryRow.tsx` — New row component with title, username, `User` icon for copy-username, `Key` icon for copy-password. Hover/selected states. All interactions are `console.log` stubs.
- `src/components/EntryList.tsx` — Scrollable list rendering EntryRow entries. Empty state with centered message when no entries.
- `src/components/VaultShell.tsx` — Two-column layout wrapper: full-width header (app name + Lock button), 280px left sidebar (EntryList), flex right panel (empty). Holds `selectedEntryId` as local state.
- `src/context/VaultContext.tsx` — Added `MOCK_ENTRIES` constant (4 entries). `unlockVault` fills empty vaults with mock data instead of empty array.
- `src/App.tsx` — Replaced unlocked placeholder with `<VaultShell />`.
- `tailwind.config.ts` — `accent.muted` updated to `#E8600A66` (40% opacity).
- `context/ui-tokens.md` — Updated `accent.muted` value to `#E8600A66`.
- `context/ui-registry.md` — Imprinted EntryRow and VaultShell patterns.

## Decisions made

- **06 — Two-column layout from start**: VaultShell establishes the 280px sidebar + flex right panel immediately, avoiding a layout refactor when EntryDetail/AddEntry arrive. Right column shows window background when nothing is selected — no placeholder.
- **06 — Full-width header**: Header bar spans the full window width, not just the sidebar. Sidebar and right panel sit below it.
- **06 — Copy icons**: `User` icon for copy-username, `Key` icon for copy-password — visually distinct without text labels.
- **06 — `accent.muted` bumped to 40% opacity**: Changed from `#E8600A33` to `#E8600A66` for more visible selected row tint, after developer feedback that 20% and 30% were still too dim.
- **06 — Mock entries in VaultContext**: 4 hardcoded entries injected when `unlockVault` receives an empty array (new vault). Removed when Phase 08 wires real persistence.

## Problems solved

- Copy buttons on EntryRow were both using the same `Copy` icon — swapped to `User`/`Key` for visual distinction without adding text labels.
- Header was initially inside the 280px sidebar — restructured to full-width header by changing VaultShell layout from `flex` root to `flex flex-col` root with header + flex row below.

## Current state

- `npx tsc --noEmit` → 0 errors
- `npx vite build` → clean build
- `cargo clippy -- -D warnings` → clean
- `cargo test` → 26/26 tests pass
- Entry list renders after unlock with mock data. Row selection, hover states, and copy icon buttons all functional (stubs).
- Lock screen → unlock → VaultShell flow works end to end.
- Copy buttons are `console.log` stubs — real clipboard not wired yet.

## Next session starts with

**07 Add Entry Form**: build `AddEntry` component with inline `PasswordGenerator`. Form fields: title (required), username, password (with reveal toggle), URL. Password generator with length slider and character set toggles. Wire `generate_password` Tauri command. All data is mock/local — no save to vault yet (Phase 08). Read `ui-registry.md` before building to match existing patterns.

## Open questions

None.
