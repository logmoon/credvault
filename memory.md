# Memory — Ship Desktop + Support Model (Planning)

Last updated: 2026-06-21

## What was built

Nothing new this session — planning only. Phase 15 (UI Polish Pass) was the last code change (committed `602dc84`). All 15 features of the desktop vault are complete and functional.

## Decisions made

- **Mobile deferred**: Phases 16–19 (Mobile) are skipped for now. Not worth the environment setup overhead. May revisit later.
- **Personal brand**: "logmoon" — support/donation links are to logmoon's personal support page, not branded as "CredVault donations."
- **Donation platform**: User is setting up Buy Me a Coffee (or similar) under the logmoon brand. URL not finalized yet — user is handling the payment setup externally before we wire it in.
- **Distribution channel**: GitHub Releases. Users download `.deb`/`.AppImage`/`.exe`/`.msi` from `github.com/logmoon/credvault/releases`.
- **Windows cross-compilation**: Will use `cargo-xwin` on this Linux machine to build Windows packages without a Windows VM.
- **macOS**: Deferred — requires a Mac to build.

## Problems solved

- Investigated Phase 16 (mobile) — determined `arboard` crate is desktop-only (would fail on mobile), `show_in_folder` has no mobile handling, and mobile builds require macOS (iOS) or Android Studio + SDK. Decided to skip.

## Current state

- `npx tsc --noEmit`: 0 errors
- `npx vite build`: clean
- All changes committed (`602dc84`)
- Phase 15 (UI Polish Pass) complete
- Tauri CLI 2.11.2 available via npx
- webkit2gtk installed — Linux builds confirmed possible
- `cargo-xwin` NOT installed yet — needed for Windows cross-compilation
- No `.github/` directory, no README, no GitHub repo yet

## Next session starts with

1. **User provides support page URL** (they're setting up Buy Me a Coffee externally)
2. Add "Support logmoon" section to `Settings.tsx` — opens support URL in browser via `open()` from `@tauri-apps/plugin-shell`
3. Create `.github/FUNDING.yml` with the chosen platform
4. Create `README.md` — what CredVault is, download links, build from source, support link
5. Run `npx tauri build` — test Linux packages (`.deb`, `.AppImage`)
6. Install `cargo-xwin` + MSVC SDK for Windows cross-compilation
7. Build Windows packages (`.exe`, `.msi`)
8. Create GitHub repo, push, attach artifacts to a release

## Open questions

- What is the support page URL? (User is setting this up externally)
- Which donation platform exactly? (BMC, GitHub Sponsors, Ko-fi, or custom page on their website?)
- Do they want a license file in the repo? (MIT? AGPL? Something else?)
