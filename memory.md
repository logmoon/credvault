# Memory — Ship + Release: Pipeline Live, v0.1.0 Draft Release, Arch PKGBUILD

Last updated: 2026-08-09

## What was built

- **README.md** — what CredVault is, features, download table (`.deb`/`.rpm`/`.AppImage`/`.msi`/`.exe`), Arch install instructions, build-from-source, security model, vault format. Notes glibc 2.35+ floor (Ubuntu 22.04+, Debian 12+, Fedora 37+).
- **LICENSE** — GPL-3.0 (full text).
- **`.github/workflows/release.yml`** — merged CI/CD: `check` job (tsc --noEmit + clippy -D warnings + cargo test) runs on every push/PR/tag; `publish-tauri` jobs (`needs: check`, `if: startsWith(github.ref, 'refs/tags/')`) build ubuntu-22.04 (`.deb`, `.AppImage`, `.rpm`) + windows-latest (`.msi`, `nsis`) via `tauri-action@v1`, creating a **draft** release per tag. Uses actions/checkout@v5 + setup-node@v5 (Node 24).
- **`.gitignore`** — `Cargo.lock` now committed (reproducible CI builds); added `*.AppImage`, `*.pkg.tar.zst`, `packaging/arch/src/`, `packaging/arch/pkg/`, `packaging/arch/*.tar.gz`.
- **`packaging/arch/PKGBUILD`** — native source-build package `credvault` (replaced the AppImage-extract `credvault-bin`). `npm ci` + `npx tauri build --no-bundle` on the user's machine against Arch system webkit2gtk-4.1/gtk3. `prepare()` renames the GitHub archive dir (`logmoon-credvault-<commit>` → `credvault-$pkgver`). Pinned sha256sums for v0.1.0 tarball: `43d9e634…`. Installed size ~15 MB vs 257 MB for the old approach. **Validated end-to-end with `makepkg -si` on the user's machine (2026-08-09) — launches and works.**
- **Vault picker commit (`af82e17`)** — disabled unlock state when the configured vault file is missing (AlertTriangle icon, disabled input, "File not found" hint); missing recent vaults pruned from picker.

## Decisions made

- **GPL-3.0 license** — copyleft chosen deliberately: security tool whose value is auditability; prevents closed forks; matches KeePassXC/Bitwarden precedent. Donation-based monetization unaffected.
- **Mobile (Phase 2) deferred permanently** — arboard/desktop crates won't compile on mobile; needs Mac/Android SDK. Revisit only if user changes mind.
- **Windows builds via GitHub Actions `windows-latest` runner** — native build in CI, replacing the planned local cargo-xwin approach. No Windows machine needed.
- **Single merged CI/CD workflow, checks gate releases** — `check` runs first; tag builds depend on it. Master pushes only run check (publish job gated by `refs/tags/` prefix).
- **Draft releases** — `tauri-action` creates releases as drafts; user reviews before publishing. Failed/broken releases get deleted + tag re-pushed rather than edited.
- **Version stays v0.1.0** — no external users yet; 1.0.0 after public usage. Tag `v0.1.0` points at `f8cfbc8` (the workflow fix commit) and must not move (moving changes the tarball → PKGBUILD sha256sum breaks).
- **Arch: source build over binary** — 257 MB AppImage extraction rejected; native build with system libs. PKGBUILD lives in `packaging/arch/` because makepkg's `src/` build dir collides with the repo's frontend `src/` at root (nearly nuked the frontend twice).
- **README keeps glibc note only** — explicitly decided NOT to document the AppImage FUSE issue.

## Problems solved

- **Windows release failure**: `--bundles msi,nsi` — `nsi` is not a valid target; it's `nsis`. Killed the job instantly.
- **AppImage-extract launch failures**: bundle ships `AppRun.wrapped` as mode 770 root:root (permission denied for users), and AppRun does `readlink -f "$(dirname "$0")"` so a `/usr/bin` symlink breaks hook resolution (`/usr/bin/apprun-hooks` not found). Both reasons the AppImage-extract packaging was abandoned.
- **linuxdeploy `.relr.dyn` strip failure on Arch** (local AppImage build): old strip in linuxdeploy's AppImage can't handle newer binutils sections. Workaround `NO_STRIP=1` for local builds; CI ubuntu-22.04 unaffected (glibc 2.35).
- **GitHub archive dir name**: internal root is `logmoon-credvault-<commitsha>` not `credvault-0.1.0/` — fixed with `prepare()` mv glob.
- **makepkg `src/` collision**: root-level PKGBUILD made makepkg extract sources into the repo's React `src/`; `rm -rf src/` cleanup deleted the frontend (restored via `git checkout`). Moved PKGBUILD to `packaging/arch/` permanently.

## Current state

- Repo `github.com/logmoon/credvault` — **private**, pushed, CI/CD green on master.
- Draft release `v0.1.0` has all 5 artifacts: `.deb`, `.AppImage`, `.rpm`, `.msi`, NSIS `.exe` (rpm worked on first try).
- Arch: `credvault` package installed on the user's machine via `makepkg -si` — works. `credvault-bin` (old broken package) uninstalled.
- Local build artifacts: `packaging/arch/credvault-0.1.0.tar.gz` (gitignored, kept for offline makepkg while repo is private).
- `npx tsc --noEmit` / `vite build` / `cargo test` / clippy: all green (CI-proven).

## Next session starts with

1. Nothing is blocked on code — the app, pipeline, and Arch package are all working.
2. **User side:** support page URL (Buy Me a Coffee under logmoon brand) — user setting up externally. Once live: "Support logmoon" section in `Settings.tsx` (`open()` from `@tauri-apps/plugin-shell`) + `.github/FUNDING.yml`.
3. **Publish steps**: flip repo public → publish draft release v0.1.0 → submit `packaging/arch/PKGBUILD` to AUR as `credvault` (needs AUR account + SSH key; regenerate sha256sums against a fresh GitHub tarball if the tag ever moves).
4. Optional polish: bump the "support" placeholder in README once URL exists.

## Open questions

- What is the support page URL / which platform? (blocking Settings support section + FUNDING.yml)
- Publish timeline: when does the repo go public?
- macOS builds: still deferred (needs a Mac).
