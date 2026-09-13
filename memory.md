# Memory — Post-Testing Fixes + v0.1.1 Release Trigger

Last updated: 2026-09-13

## What was built

- **Three post-testing fixes** (user-confirmed, all in frontend only — no Rust changes):
  - `src/components/VaultShell.tsx` — header title container now `min-w-0`, app name `truncate`, right controls group `shrink-0`; sidebar widened `w-[280px]` → `w-[320px]`.
  - `src/components/WindowControls.tsx` — root container `shrink-0` (defensive; also used on LockScreen).
  - `src/components/SearchBar.tsx` — `autoFocus` on the input: search focused on every VaultShell mount (= every unlock).
- **Docs synced**: `context/ui-rules.md` (sidebar 320px), `context/ui-registry.md` (VaultShell row + pattern notes, new WindowControls entry, SearchBar autofocus note, dates), `context/progress-tracker.md` (Post-Testing Fixes section + notes).
- **Release v0.1.1**: version bumped 0.1.0 → 0.1.1 in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` (+ `Cargo.lock`), tag `v0.1.1` pushed. CI builds draft release with 5 artifacts; `update-pkgbuild` job syncs Arch PKGBUILD (pkgver=0.1.1, pkgrel=1) on master.

## Decisions made

- **Window controls fixed in CSS, not config** — `minWidth: 720` in `tauri.conf.json` is an XDG/WM hint; sway (user's compositor, Arch) ignores it for tiled windows, so the window can be forced narrower than the header's min-content. The header now lets the title truncate first and never lets the controls group shrink. Controls stay visible down to ~220px window width.
- **Sidebar 320px fixed**, not resizable — matches "a little bigger" request; keeps 400px right panel at the 720px minimum window width.
- **`autoFocus` is mount-scoped by design** — no refocusing when panels/dialogs close, to avoid focus stealing. Only on VaultShell mount (unlock).
- **v0.1.1, not re-tagged v0.1.0** — the v0.1.0 tag is frozen: the Arch PKGBUILD sha256 pins the v0.1.0 source tarball, and the `update-pkgbuild` CI job derives pkgver/pkgrel from the tag. Post-release fixes go out as a patch bump.

## Problems solved

- **Window controls going off-screen on narrow windows** — root cause: `justify-between` header with non-shrinkable children; below ~290px the right group overflowed the viewport and `body { overflow: hidden }` (`src/index.css`) clipped it. Sway tiling ignores `minWidth`, making this reachable. Fix: title `min-w-0`/`truncate` (yields first), controls `shrink-0` (never yields).
- No other issues; `npx tsc --noEmit` and `npm run build` green.

## Current state

- Repo `github.com/logmoon/credvault` — **private**. Tag `v0.1.1` pushed at session end; CI `check` + `publish-tauri` + `update-pkgbuild` running/expected green.
- Draft release `v0.1.0` (5 artifacts) still exists unpublished; draft `v0.1.1` will contain `.deb`, `.AppImage`, `.rpm`, `.msi`, NSIS `.exe`.
- Local Arch package still 0.1.0 (`makepkg -si` install) — rebuild from the synced PKGBUILD after CI updates master if the new build is wanted locally.
- `tasks/` folder is untracked by design (user's task tooling; do not commit unless asked).

## Next session starts with

1. Verify CI on the `v0.1.1` tag: `gh run list` → `gh run watch`; confirm draft release has all 5 artifacts and `update-pkgbuild` committed the PKGBUILD sync to master.
2. Publish the draft release when the user is ready (repo must go public first for downloads/AUR).
3. **User side:** support page URL (Buy Me a Coffee under logmoon brand) — once live: "Support logmoon" section in `Settings.tsx` (`open()` from `@tauri-apps/plugin-shell`) + `.github/FUNDING.yml`.
4. AUR submission of `packaging/arch/PKGBUILD` as `credvault` (needs public repo + AUR account/SSH key).

## Open questions

- Support page URL / platform? (blocks Settings support section + FUNDING.yml)
- Publish timeline: when does the repo go public? (blocks publishing drafts + AUR)
- macOS builds: still deferred (needs a Mac).