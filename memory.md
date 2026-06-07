# Memory — Phase 11: Settings Screen, Border Audit, UI Polish

Last updated: 2026-06-07

## What was built

### Phase 11 — Settings Screen
- `src/components/Settings.tsx` — Full-screen modal overlay (w-[600px], max-h-[80vh]) with vault path picker (native Tauri dialog), lock timeout slider (1-60 min), clipboard timeout slider (15-120s), auto-clear toggle. Every change persists immediately to config.json. Overlay + Escape dismiss. Sync Now button disabled placeholder (Phase 12).
- `src-tauri/src/config.rs` — New Rust module: `VaultConfig` struct, `read_config`/`write_config` with JSON serialization, `read_config_from_app`/`write_config_from_app` helpers for app data dir path resolution.
- `commands.rs` — Added `load_config`, `save_config`, `pick_vault_path`, `change_vault_path` commands. `change_vault_path` copies vault file (not re-encrypts), updates `SessionState.path`, writes new path to config.json. Shows ConfirmDialog if target already has a vault.
- Lock button changed from text to lucide `Lock` icon (matching gear icon styling).

### Border token system + UI polish
- Three-level border color scale in `tailwind.config.ts`: `border.subtle` (#FFFFFF0D), `border.DEFAULT` (#FFFFFF1A), `border.strong` (#FFFFFF26).
- Sidebar + header use `bg-surface` for visual separation from right panel `bg-surface-window`.
- Settings cards use `bg-surface-raised` with `border border-border`.
- Right panel scrolling restructured: AddEntry/EntryDetail use `absolute inset-0` with split scroll area (`flex-1 overflow-y-auto min-h-0 p-6`) + fixed pinned footer (`border-t border-border shrink-0`).
- Header separators use `border-border-strong`, footer separators use `border-border`, inputs/buttons use `border-border-subtle`.

## Decisions made

- **Settings as modal overlay, not right panel**: Covers most of app, follows ConfirmDialog pattern. Overlay click + Escape dismiss.
- **Vault path change takes effect immediately**: Copies vault file, updates SessionState, writes config.json. Does not require re-lock/unlock.
- **No "Save" button in Settings**: Every config change persists immediately on interaction (slider move, checkbox toggle, path change).
- **border color conflict resolution**: Since the color group is named `border`, all variants must be prefixed with `border-border-`. The subtle variant is `border-border-subtle`, NOT `border-subtle` (which silently resolves to nothing in Tailwind's parser).

## Problems solved

- **`border-subtle` silently missing from build**: Tailwind's `border` color group conflicts with the `border` width utility class. `border-subtle` never generated in CSS. Fix: use `border-border-subtle` (matching the pattern of `border-border` for DEFAULT and `border-border-strong` for strong). Confirmed by grepping the compiled CSS output.
- **12 remaining `border-white/5` instances**: Found via `/review` audit across 6 files. Replaced with `border-border-subtle` (after the naming fix above).

## Current state

- Phase 11 complete and verified
- `npx tsc --noEmit`: 0 errors
- `npx vite build`: clean
- `cargo clippy -- -D warnings`: clean
- `cargo test`: 26/26 pass
- All 11 components documented in `ui-registry.md` with current border tokens

## Next session starts with

**Phase 12 — Sync: On-Open Pull and On-Save Push**: Wire vault read/write to the sync path. Implement on-open check. Build `useSync` hook. Sync status indicator in the top bar.

## Open questions

- ConfirmDialog uses `bg-surface-window` (#141414) but design tokens specify `surface.overlay` (#2E2E2E) for modals. Flagged in ui-registry.md as a deviation.
- `pick_vault_path` uses `blocking_pick_file` inside an async Rust command — consider making it non-async or using non-blocking picker if it causes issues.
