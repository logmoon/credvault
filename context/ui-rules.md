# UI Rules — CredVault

## Layout

- **Window:** No maximum width — the app fills the Tauri window. Minimum window size: 720px × 500px desktop.
- **Desktop layout:** Two-column. Left column: fixed 280px sidebar containing `SearchBar` and `EntryList`. Right column: flexible, fills remaining space — shows `EntryDetail`, `AddEntry`, or `Settings` depending on state. When nothing is selected, the right column is empty (not a placeholder — just the window background).
- **Mobile layout:** Single column, full screen. Bottom tab bar with three tabs: Vault (entry list), Add, Settings. Navigation between entry list and entry detail is a full-screen push.
- **Page padding:** `24px` on all sides for desktop content areas. `16px` on mobile.
- **Section gap:** `20px` between distinct content sections within a screen.
- **Lock screen:** Full-screen, centered single column. Max width of the content area: `360px`. Vertically centered with slight upward offset (centered at 45% height, not 50%).

---

## Navigation

- **Desktop:** No visible nav bar or tabs. The two-column layout is always present once unlocked. A lock button sits in the top-right of the left sidebar. The app name sits in the top-left of the left sidebar in muted text.
- **Mobile:** Bottom tab bar — three tabs: a vault icon (entry list), a plus icon (add entry), a settings icon. Active tab icon uses the accent color (`#E8600A`). Inactive tabs use `text.muted`.
- **Lock button:** Always reachable. On desktop: top-right of the sidebar. On mobile: top-right of the vault tab header.
- **Active states:** Selected entry row uses a neutral background tint (`surface-hover`) with a 2px accent-orange left border. No underlines, no bold weight changes for active nav items — background and border alone distinguish active state.

---

## Entry List

- Each entry row is `56px` tall and contains two lines: the entry title (14px, `text.primary`) and the username (12px, `text.secondary`).
- On hover, the row background lifts to `rgba(255,255,255,0.05)`.
- The selected row uses `rgba(232,96,10,0.10)` as background — a subtle accent tint, not a heavy highlight.
- Copy-username and copy-password icon buttons appear at the right edge of the row. On desktop they are always visible. On mobile they appear via swipe-left gesture.
- The delete button appears only in `EntryDetail`, never in the row itself on desktop (desktop delete requires opening the entry). On mobile, delete appears in the swipe-left action strip alongside copy buttons.
- Row interactions: single click opens `EntryDetail` in the right column. Copy buttons do not open the detail — they copy and show the toast.
- The entire left column scrolls if entries exceed the visible height. The search bar is sticky at the top of the left column.

---

## Cards and Sections

- Settings uses a card-per-section layout: each logical group (Vault, Security, Clipboard) is a `surface.DEFAULT` card with `8px` border radius, `16px` padding, and a subtle border.
- Section headings inside cards use the caption style: 11px, `text.muted`, uppercase, letter-spacing 0.08em.
- Consistent `16px` padding inside all cards. No mixed padding within a card.
- Form elements inside cards have `12px` gap between them.

---

## Typography Hierarchy

| Level | When to use |
|---|---|
| Entry title (14px 500) | Entry row title, entry detail heading, modal title |
| Body / label (13px 400) | Form field labels, settings labels, description text |
| Entry username (12px 400 muted) | Second line of entry rows, supporting info |
| Input text (13px mono) | Password fields, URL fields, vault path display |
| Section heading (11px 500 muted uppercase) | Settings section headers, card group labels |
| Caption / hint (11px 400 muted) | Field hints below inputs, timestamps, character counts |

Never mix heading levels within a single card or section. A card has at most one entry-title-level element at the top and body-level content below.

---

## Buttons

- **Primary (orange accent):** Used for the single most important action on a screen — Unlock, Save, Create Vault. There is at most one primary button visible at a time.
- **Secondary (ghost):** Used for all other actions — Cancel, Generate, Change Path, Keep. Can appear alongside a primary button.
- **Destructive:** Used only for Delete actions. Never the primary action on initial view — always requires a confirmation step first.
- **Icon buttons:** Used for copy, delete (in rows), reveal, close. Always `36×36px` tap target, centered icon. No visible border by default — border appears on hover (`rgba(255,255,255,0.08)` background).
- **Button placement in forms:** Primary button on the right, secondary (Cancel) on the left. Never stack buttons vertically on desktop unless the context is a warning dialog.

---

## Forms

- Labels sit above their input fields, never inline or to the left. Label to input gap: `6px`.
- Required fields have no asterisk — the label text is sufficient. Validation errors appear below the field (not as a tooltip), in `status.error` color, 11px.
- Every form has exactly one primary submit button. It is disabled until the minimum required fields are filled.
- The password field always has a reveal toggle (eye icon) on the right edge, inside the input. The toggle switches between `type="password"` and `type="text"`. The icon switches between `Eye` and `EyeOff`.
- The password generator component sits directly below the password input field, visually connected. It is not a separate section.
- On Enter keypress in any input field, the form submits if the primary action is available.
- "Save" and "Add" forms always have a visible "Cancel" action — either a button or pressing Escape closes the panel.

---

## Empty States

Every section that can be empty must have an empty state. The pattern:

- Centered vertically and horizontally in the content area
- Muted icon (24px, `text.muted`) above the message
- Short message (13px, `text.secondary`): e.g. "No entries yet"
- Optional secondary line (12px, `text.muted`): e.g. "Add your first credential to get started"
- No illustration, no decorative elements beyond the icon

| Screen / Section | Empty State Message |
|---|---|
| Entry list (no entries) | "No entries yet — Add your first credential" |
| Entry list (search no results) | "No entries match '[query]'" |
| Right panel (nothing selected) | _(empty — just the window background, no message)_ |

---

## Password Display Rules

- Passwords are **always hidden by default** everywhere in the UI — in entry rows, in the detail view, in forms.
- The reveal toggle must be explicitly clicked to show a password. Clicking away from the detail view does not hide it again — the toggle state is local to the component.
- **Copying a password never reveals it.** The copy icon button reads from the entry data directly, not from what is displayed.
- Revealed passwords use the monospace font (`JetBrains Mono`) in `text.primary` color.
- In the entry list, passwords are never displayed — not even masked. Only title and username are shown.

---

## Clipboard Toast Behaviour

- The toast appears immediately when a copy action is triggered.
- Position: bottom-center, `24px` from the bottom edge of the window.
- The countdown text updates every second: "Clearing clipboard in 28s", "Clearing clipboard in 27s"...
- Two actions on the toast: "Clear now" (immediately clears clipboard and dismisses) and "×" (dismiss without clearing — clipboard persists until the timeout fires naturally).
- If a second copy is triggered while the toast is visible, the existing countdown resets to the full timeout. No stacking of toasts.
- The toast does not block any other interaction — it floats above the content.

---

## First-Run Warning

Shown once, during vault creation, never again. It is not dismissable with a checkbox or "I understand" — it is just text that precedes the create button. The text must be exact:

> **There is no password recovery.**
> Your master password is the only key to your vault. If you forget it, your data cannot be recovered — by anyone. Write it down somewhere safe.

Styling: `#C4840A` (warning amber), 12px, line-height 1.6, in a `surface.raised` card with a left border in `status.warning` color, `4px` wide.

---

## Do Nots

1. **Never show a password in plain text by default.** All password fields start in `type="password"`. No exceptions, including the password generator output.
2. **Never use a gradient, drop shadow, or glow effect.** Every surface is flat. The design language is dense and utility-focused — decoration is visual noise.
3. **Never use more than one accent color.** The orange (`#E8600A`) is the only non-neutral color used for interactive emphasis. No blue links, no green success buttons, no purple anything.
4. **Never show vault content in the lock screen.** No entry count, no last-unlocked timestamp, no username hints. The lock screen reveals nothing about the vault contents.
5. **Never auto-submit a form.** The user always clicks the primary button or presses Enter intentionally. No form submission on blur or timeout.
6. **Never use `alert()` or `confirm()`.** All confirmations use the `ConfirmDialog` component. All errors use inline messages or the error toast.
7. **Never use a light background.** The app is dark-first. `surface.window` (`#141414`) is the darkest layer. Nothing in the UI should be lighter than `surface.overlay` (`#2E2E2E`) except text.
8. **Never put a delete button as a primary or direct action.** Delete always requires: (1) opening entry detail, (2) clicking Delete (destructive button), (3) confirming in `ConfirmDialog`. Three steps minimum.
9. **Never show a loading spinner for local operations.** Crypto operations on a typical vault take under 100ms. If an operation is genuinely slow (first Argon2 derivation), show a text label ("Unlocking…") on the button rather than a spinner.
10. **Never truncate a title or username with an ellipsis in the detail view.** Truncation is only acceptable in the entry list rows. In `EntryDetail`, all fields show their full content.
