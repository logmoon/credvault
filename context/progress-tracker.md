# Progress Tracker — CredVault

## Current Status

**Phase:** Phase 0 — Working Desktop Vault
**Last completed:** 07 Add Entry Form
**Next:** 08 Wire Entry CRUD to Vault

---

## Progress

### Phase 0 — Working Desktop Vault

- [x] 01 Tauri Project Scaffold
- [x] 02 Rust Crypto Layer
- [x] 03 Vault File Read/Write
- [x] 04 Tauri Commands (IPC Bridge)
- [x] 05 Lock Screen UI
- [x] 06 Entry List UI
- [x] 07 Add Entry Form
- [x] 08 Wire Entry CRUD to Vault
- [ ] 09 Clipboard Auto-Clear
- [ ] 10 Auto-Lock Timer

### Phase 1 — Sync + Polish

- [ ] 11 Settings Screen
- [ ] 12 Sync — On-Open Pull and On-Save Push
- [ ] 13 Conflict Resolution
- [ ] 14 Search
- [ ] 15 UI Polish Pass

### Phase 2 — Mobile

- [ ] 16 Mobile Tauri Targets
- [ ] 17 Mobile UI Adaptations
- [ ] 18 Mobile Auto-Lock on Background
- [ ] 19 Cross-Device Vault Compatibility Test

---

## Decisions Made During Build

- **05 — Default vault path via Rust command**: `get_default_vault_path` uses `app.path().app_data_dir()` to resolve platform-appropriate path, keeps platform logic in Rust only.
- **05 — Unlocked placeholder for Phase 05**: Since `VaultShell` (Phase 06) doesn't exist yet, `App.tsx` renders a minimal unlocked state showing entry count or "no credentials" message.
- **05 — LockScreen loads path on mount**: Gets default vault path and checks existence in a `useEffect`; shows loading state briefly while resolving.
- **04 — Vault body structs in vault.rs**: `VaultBody` and `Entry` serde structs live in `vault.rs` alongside `VaultHeader`, keeping all vault format types together.
- **04 — save_vault reads existing vault**: Rather than sending vault metadata from the frontend, `save_vault` reads + decrypts the existing vault to extract `vaultId`/`createdAt`/`deletedEntryIds`, then re-encrypts with updated entries. Keeps format details in Rust only.
- **04 — vault_exists included in Phase 04**: Trivial `Path::exists()` command added now since Phase 05 immediately needs it.
- **04 — payload format helpers**: Added `split_payload()` to vault.rs for splitting nonce[12] + ciphertext[var] + tag[16]. Return type aliased as `SplitPayload` to satisfy clippy.
- **04 — Generator fallback to lowercase**: When all character set flags are false, generator falls back to lowercase-only. Never returns empty string.
- **04 — `uuid` crate added**: Used for vault_id generation on creation.

---

## Notes

- **06 — Two-column layout from start**: VaultShell establishes the 280px sidebar + flex right panel immediately, avoiding a layout refactor when EntryDetail/AddEntry arrive. Right column shows window background when nothing is selected — no placeholder.
- **06 — Full-width header**: Header bar spans the full window width, not just the sidebar. Sidebar and right panel sit below it.
- **06 — Copy icons**: `User` icon for copy-username, `Key` icon for copy-password — visually distinct without text labels.
- **06 — `accent.muted` bumped to 30% opacity**: Changed from `#E8600A33` to `#E8600A4D` for more visible selected row tint.
- **06 — Mock entries in VaultContext**: 4 hardcoded entries injected when `unlockVault` receives an empty array (new vault). Removed when Phase 08 wires real persistence.
- **07 — FAB button**: Bottom-right, accent, rounded-full, no shadow. Hidden when AddEntry is open.
- **07 — Right panel state union**: `null | 'add' | 'edit'` used from Phase 07 to avoid refactor in Phase 08.
- **07 — Password visible by default**: `showPassword: true` in AddEntry context — user sees what they type.
- **07 — PasswordGenerator toggle pattern**: Header always visible; clicking toggles panel. No separate collapse button.
- **07 — Selected row style**: `bg-surface-raised` + `border-l-2 border-accent`. Replaced accent-tint approach after 4 opacity iterations.
- **07 — `accent.muted` removed**: No longer used. Selected row uses neutral raised bg + accent border instead.
