# Brief v2 — Exceed Box login screen, 4 layout variations

Your previous attempt was rejected as not good enough. This version gives you real reference
patterns from shipped apps. Follow them closely — that is the point. Do not invent a new layout
language; adapt these proven ones to the Exceed brand.

## What Exceed Box is
An **internal iOS + iPadOS app** for **Exceed Real Estate** — a Dubai property brokerage (HQ Business
Bay, Tokyo office) selling to Japanese high-net-worth investors. ~10–15 staff use it: agents in
Dubai, an office in Japan, the CEO. **Nobody signs up. Every user is an employee.** So: no "Create
account", no "Sign up", no marketing copy, no social proof, no onboarding carousel.

## Your one deliverable
Overwrite: `/Users/a44/code/exceed-box-ios/design/login/login-variations.html`
Four variations side by side. One file. Nothing else. Do not scaffold an app.

## Reference patterns — study these, they are from real shipped iOS apps

**V1 — the OpenPhone pattern.** Screen is mostly empty. A small wordmark top-left. A large,
left-aligned, three-line headline in big tight type. Then a lot of deliberate empty space. The
actions sit LOW on the screen: one dominant filled button (Continue with Google), and beneath it a
quieter outline-only button (Sign in with email). Legal/version microcopy at the very bottom.
*Why it works:* the two doors are unmistakably ranked without the second one looking broken.

**V2 — the YNAB pattern.** Everything centred in one narrow column. Logo in the top third. SSO
button FIRST, before any input fields. Then a horizontal rule with "or" centred in it. Then email
and password fields stacked. Then the primary button — rendered in its DISABLED state, dimmed,
because the fields are empty. Then "Forgot password?" as a small link.
*Why it works:* the most familiar login shape on iOS. Nobody has to think.

**V3 — the On Running pattern.** The top ~45% is a solid brand block. The login rises from the
bottom as a LIGHT sheet with large rounded top corners and a soft shadow over the brand block.
Inside the sheet: a heading, the Google button, a divider, then minimal underlined-style text
inputs rather than boxed ones.
*Why it works:* the brand gets real presence without a photograph, and the form reads as a focused
task laid on top of it.

**V4 — progressive disclosure.** Only the email step is visible. One question in plain language
("What's your work email?"), ONE input field with a visible focus ring and cursor, one Continue
button, and a thin 2-segment step indicator at the top. The password does not exist yet on this
screen. The Google route is a single quiet text link far below, separated by a lot of space.
*Why it works:* the calmest possible screen; it also fits a company where the email domain itself
is the gate.

Each must be a complete, believable, shippable screen — not a wireframe.

## Hard brand rules (locked — do not invent alternatives)
- Charcoal `#15171C` (base), `#1C1F26` (raised surface), `#2F3340` (borders)
- Single accent yellow `#FFD84D`; secondary gold `#F0B429`
- Light neutrals `#F6F7F9`, `#EEEFF2`, `#C9CDD6`
- **Banned outright: photographs, skyline imagery, glowing orbs, gradient text, gradient
  backgrounds, illustrations, glassmorphism, blur effects.** Flat colour only. This is a Wise-style
  brand and these are explicitly forbidden in its spec.
- Font: system stack only (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`).
  **No CDN, no Google Fonts, no external requests.** Must render fully offline.

## Logo
`exceed_logo.jpg` is in this folder — but it is a **light-background JPG**, so dropping it straight
onto charcoal will look wrong. Prefer a **typographic wordmark**: `EXCEED` in yellow `#FFD84D`,
letter-spaced, weight 700, with a small grey `BOX` beneath or beside it. Use the JPG in at most one
variation, and if you do, place it on a light chip/plate so it sits correctly.

## The login itself — two doors, both on every variation
1. **Primary — "Continue with Google"**, with the Google G mark. Under it, small grey:
   `Exceed accounts only` / `Exceedアカウントのみ`.
2. **Secondary — email + password**, with a show/hide eye toggle on the password field, a "Sign in"
   button, and a small "Forgot password?" link.

The interesting design problem is the **hierarchy between them** — Google must read as the normal
way in without making the password route look like a fallback for broken accounts. Solve it
differently in each variation.

Also: small grey `v1.0.0` at the very bottom of every variation.

## Language house style
English primary, **Japanese in small grey (~11px) beneath or beside it**:
- `Email` / `メールアドレス`
- `Password` / `パスワード`
- `Sign in` / `ログイン`
- `Continue with Google` / `Googleでログイン`
- `Forgot password?` / `パスワードをお忘れですか`

## How to present them
- Page background: neutral dark grey, clearly not the app itself
- Each variation inside a realistic **iPhone frame, 393 × 852**: rounded corners, thin bezel, status
  bar with 9:41 / signal / wifi / battery, home indicator bar at the bottom
- Four frames in a row, wrapping on narrow screens
- Above each frame: `V1`…`V4`, the concept name, and **one line** on when you would pick it
- Below the row: a short note per concept on how it adapts to **iPad** — the app is universal and
  the iPad sits on a showroom desk in Japan, used by whoever walks up to it

## Quality bar
This gets shown to a CEO. That means: a real type scale (not everything 16px), correct optical
spacing, 44px minimum touch targets, and **states that look designed** — focus ring on the active
field, disabled primary button until both fields are filled, pressed state on buttons. Get the
small things right: the Google G should be the real four-colour mark drawn in inline SVG, the eye
toggle should be a proper icon, the status bar should look like iOS.

When done, print only the absolute path of the file you wrote.
