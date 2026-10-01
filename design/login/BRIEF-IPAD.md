# Brief — Exceed Box login screen, iPad versions of the same 4 concepts

A separate task from `BRIEF.md`. That one covers iPhone. **This one is iPad.**

## Your one deliverable
`/Users/a44/code/exceed-box-ios/design/login/login-variations-ipad.html`
One self-contained file. Do not touch `login-variations.html` — another process owns it.

## What Exceed Box is
An **internal iOS + iPadOS app** for **Exceed Real Estate** — a Dubai property brokerage (HQ Business
Bay, Tokyo office) selling to Japanese high-net-worth investors. ~10–15 staff: agents in Dubai, an
office in Japan, the CEO. **Nobody signs up. Every user is an employee.** No "Create account", no
sign-up link, no marketing copy, no onboarding carousel.

## Why iPad is genuinely different here — read this before designing
The iPad is not a big iPhone in this product. It has **two distinct real-world uses**:
1. A **manager's iPad**, held, used to review the pipeline.
2. A **showroom iPad in Japan, sitting in a stand on a desk, in landscape**, where an Exceed agent
   types in details for a walk-in visitor standing in front of them.

Design for **landscape 1366 × 1024** as the primary case, and show a **portrait 1024 × 1366**
variant alongside it. The showroom device is the reason landscape leads.

**The single most important iPad rule: do not stretch the form.** A 1366px-wide screen must not
produce 1366px-wide input fields. The interactive column stays roughly **420–480px** and is
deliberately placed — centred, or in one half of a split. Everything else on the canvas is
structure, brand, or calm empty space.

## The four concepts — translate each honestly to iPad
The iPhone versions are V1 OpenPhone-style / V2 YNAB-style centred / V3 On-style bottom sheet /
V4 progressive one-field-at-a-time. Keep the same numbering so the two files can be compared
side by side.

- **V1 — Split.** Charcoal brand half on the left carrying the wordmark and the big three-line
  headline; the login column on the right, vertically centred, max 440px wide. This is the classic
  enterprise-iPad shape and the most natural home for the OpenPhone hierarchy.
- **V2 — Centred card.** A single raised `#1C1F26` card, max 480px wide, floating in the middle of a
  charcoal canvas, with the YNAB ordering inside it: logo, Google button, `or` divider, email +
  password, disabled primary, forgot link. Generous margin all around; the card must feel placed,
  not dropped.
- **V3 — Sheet becomes a panel.** A bottom sheet is wrong on iPad. Translate it: a light `#F6F7F9`
  panel occupying the right ~45% of the landscape canvas edge to edge, with the charcoal brand block
  as the left ~55%. In portrait it can return to a bottom sheet.
- **V4 — Progressive, centred.** One question, one field, one button, centred in a 420px column on a
  wide charcoal canvas — with the 2-segment step indicator. On a big screen the emptiness is the
  design; lean into it rather than filling space.

## Hard brand rules (locked — do not invent alternatives)
- Charcoal `#15171C` (base), `#1C1F26` (raised surface), `#2F3340` (borders)
- Accent yellow `#FFD84D`; secondary gold `#F0B429`
- Light neutrals `#F6F7F9`, `#EEEFF2`, `#C9CDD6`
- **Banned outright: photographs, skyline imagery, glowing orbs, gradient text, gradient
  backgrounds, illustrations, glassmorphism, blur.** Flat colour only — Wise-style brand spec.
- Font: system stack only. **No CDN, no external requests.** Must render fully offline.

## Logo
`exceed_logo.jpg` is in this folder but is a **light-background JPG** — it will look wrong dropped on
charcoal. Prefer a typographic wordmark: `EXCEED` in `#FFD84D`, letter-spaced, weight 700, small grey
`BOX` beneath or beside. On iPad the wordmark can be considerably larger than on phone.

## The login itself — two doors, on every variation
1. **Primary — "Continue with Google"** with the real four-colour Google G drawn as inline SVG.
   Small grey caption under it: `Exceed accounts only` / `Exceedアカウントのみ`.
2. **Secondary — email + password**, show/hide eye toggle, "Sign in" button, small "Forgot password?".

Hierarchy is the design problem: Google reads as the normal way in, without the password route
looking broken.

Small grey `v1.0.0` at the bottom of every variation.

## iPad-specific details that must be right
- **Touch targets 44px minimum**, but on iPad prefer 56–60px — it is used standing up, at arm's length.
- **A hardware keyboard may be attached.** Show a visible focus ring on the active field and make the
  tab order obvious; this is not a phone where everything is thumbed.
- **Show one variation with the software keyboard raised** in landscape, so it is clear the form does
  not get covered — this is the most common iPad login failure and worth proving.

## Language house style
English primary, **Japanese in small grey (~12px on iPad)** beneath or beside:
`Email` / `メールアドレス` · `Password` / `パスワード` · `Sign in` / `ログイン` ·
`Continue with Google` / `Googleでログイン` · `Forgot password?` / `パスワードをお忘れですか`

## How to present them
- Page background: neutral dark grey, clearly not the app itself
- Each variation inside a realistic **iPad frame** with thin uniform bezel, rounded corners, iPadOS
  status bar (time left, wifi/battery right), and a home indicator
- **Landscape 1366 × 1024 first for all four**, scaled down to fit the page — then a second row
  showing the same four in **portrait 1024 × 1366**
- Above each frame: `V1`…`V4`, concept name, and one line on when you would pick it
- Below: a short note per concept on what genuinely changed from the iPhone version and why

## Quality bar
This gets shown to a CEO. Real type scale, correct optical spacing, designed states (focus ring,
disabled primary until both fields are filled, pressed state). The Google G must be the real
four-colour mark in inline SVG. The status bar must look like iPadOS.

When done, print only the absolute path of the file you wrote.
