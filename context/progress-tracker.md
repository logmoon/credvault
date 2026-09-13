# Progress Tracker — CredVault

## Current Status

**Phase:** Ship + Release — post-testing fixes done, v0.1.1 release build triggered
**Last completed:** Three post-testing fixes (window controls pinned, sidebar widened, search autofocus) — user-confirmed
**Next:** CI builds draft release v0.1.1 (5 artifacts) — then publish / AUR submission (blocked on repo going public)

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
- [x] 09 Clipboard Auto-Clear
- [x] 10 Auto-Lock Timer

### Phase 1 — Sync + Polish

- [x] 11 Settings Screen
- [x] 12 Sync — On-Open Pull and On-Save Push
- [x] 13 Conflict Resolution
- [x] 14 Search
- [x] 15 UI Polish Pass

### Phase 2 — Mobile (deferred)

- [ ] 16 Mobile Tauri Targets
- [ ] 17 Mobile UI Adaptations
- [ ] 18 Mobile Auto-Lock on Background
- [ ] 19 Cross-Device Vault Compatibility Test

### Phase 3 — Ship + Release

- [x] GPL-3.0 LICENSE + README
- [x] GitHub Actions CI/CD pipeline (check gates release builds on v* tags)
- [x] Linux: .deb, .AppImage, .rpm / Windows: .msi, NSIS .exe
- [x] Private repo logmoon/credvault with draft release v0.1.0 (5 artifacts)
- [x] Arch PKGBUILD — native source build (`packaging/arch/`), validated via `makepkg -si`
- [ ] Publish draft release v0.1.1
- [ ] AUR submission (repo must be public first)
- [ ] Support section in Settings (blocked on support URL)

### Post-Testing Fixes (2026-09-13)

- [x] Window controls stay pinned right at any window width (`min-w-0` + `truncate` on title, `shrink-0` on controls group). Root cause: `minWidth: 720` is a WM hint and is ignored by sway tiling — fixed in CSS, not config.
- [x] Sidebar widened 280px → 320px
- [x] Search bar autofocuses on every vault unlock (`autoFocus` on the SearchBar input)
- [x] ui-rules.md + ui-registry.md synced (sidebar width, header shrink behavior, autofocus note, WindowControls entry)
- [x] Version bumped 0.1.0 → 0.1.1; tag v0.1.1 pushed — CI builds draft release + auto-syncs Arch PKGBUILD


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

### Phase 09 — Clipboard Auto-Clear

- **09 — Tauri clipboard-manager plugin used**: Replaced `navigator.clipboard.writeText()` with `@tauri-apps/plugin-clipboard-manager` — the official Tauri 2.0 approach (old `@tauri-apps/api/clipboard` was removed). Plugin registered in Rust, `clipboard-manager:allow-write-text` permission added to capabilities.
- **09 — Config loaded in VaultContext on mount**: `loadConfig()` called on provider mount. Defaults on first run. `clipboardTimeoutMs` and `clipboardAutoClear` exposed via context.
- **09 — useClipboard hook lives in VaultShell**: Local hook, not global. Timers cleaned up on unmount (handles auto-lock). Handlers pass down through existing prop chain.
- **09 — Native OS clipboard clear via arboard**: `clear_clipboard` Rust command uses `arboard::Clipboard::clear()` for a proper OS-level clipboard wipe (all formats, not just text). Added as direct Cargo dep + custom Tauri command.
- **09 — Smart clear with readText check**: Before clearing, hook reads clipboard via `readText()` and only calls `clear_clipboard` if the password is still there. Prevents overwriting user's subsequent copies.
- **09 — Brief toasts, no persistent UI**: Two 1.5s auto-dismissing toasts — "Copied — clears in {n}s" on copy, "Clipboard cleared" when native clear fires. No countdown, no "Clear now"/"Keep" buttons.
- **09 — clipboardAutoClear config field added**: Schema includes `clipboardAutoClear: boolean` (default `true`). When false, hook skips timeout entirely — just copies and shows confirmation toast. Phase 11 will add Settings toggle UI.

---

## Notes

- **06 — Two-column layout from start**: VaultShell establishes a fixed sidebar (currently 320px) + flex right panel immediately, avoiding a layout refactor when EntryDetail/AddEntry arrive. Right column shows window background when nothing is selected — no placeholder.
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
- **09-13 — Keep `minWidth: 720` but don't rely on it**: It works for floating windows but sway/tiling compositors ignore WM size hints. The VaultShell header must survive arbitrarily narrow widths in pure CSS; the title truncates, controls never shrink.
- **09-13 — Search autofocus is mount-scoped**: `autoFocus` on the SearchBar input fires on every `VaultShell` mount (= every unlock). Deliberately not re-focusing after closing panels/dialogs — no focus stealing.
- **09-13 — New tag v0.1.1, not re-tagged v0.1.0**: The v0.1.0 tag is frozen (PKGBUILD sha256 for the published source tarball depends on it). Post-release fixes go out as a patch bump; CI's `update-pkgbuild` job syncs pkgver/pkgrel from the tag automatically.
