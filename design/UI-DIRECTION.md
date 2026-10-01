# Exceed Box — UI direction v2 (client-supplied references)

The screens work. They are not beautiful. This pass raises the visual quality to the two references
the client gave, **without changing behaviour, routing, role-gating or API calls.**

## Reference 1 — Haulix logistics dashboard (Phenomenon Studio)
https://dribbble.com/shots/27229691-UI-UX-Design-for-Logistics-Dashboard-Haulix

What to take from it, precisely:
- **Near-black, layered surfaces.** Page `#0D0E11`, card `#141619`, raised/nested `#1A1D22`.
  Separation comes from a **1px hairline border `#22262E`**, not from shadows. No heavy shadows.
- **Colour is reserved for status only.** Everything structural is greyscale. A screen should read
  as monochrome with two or three coloured pills on it. Right now there is far too much yellow —
  yellow is the *primary action and the brand accent*, not a body colour.
- **Compact status pills**: 11px, weight 700, 2px/8px padding, pill radius, a 6px dot or small glyph
  on the left, tinted background at ~14% opacity of the status colour with the text at full strength.
- **Two-column label/value grids** for detail data — tiny uppercase grey label above, value below in
  white at 15px. Not sentences. `Client / TechFlow Inc.` `Destination / Memphis, TN`.
- **Uppercase micro-labels**: 10px, weight 800, letter-spacing .08em, colour `#6E7480`.
- **Tabular figures for every number** (`fontVariant: ['tabular-nums']`) so columns align.
- **Dashed 1px borders** for empty slots and empty states.
- **Section headers** = small glyph + title + a count chip, then the content. Not a bare bold word.

## Reference 2 — progress indicators
https://namethatui.com/web/progress-indicators?part=progress-bar

The rule it teaches, which this app currently gets wrong:
- **A known value gets a determinate indicator with a visible track and a value label.**
  The lead **score is 0–100 — that is a determinate linear progress bar**, currently rendered as a
  bare number in a circle. Give it: a 4px track `#22262E`, a fill coloured by heat, and the number
  beside it. The bar is what makes 92 and 24 feel different at a glance.
- **Unknown duration gets a spinner — and almost nothing here has unknown duration.** Replace
  loading spinners with **skeletons** that match the real layout, because we know what is coming.
- Apply the same bar to the **funnel** and to **per-rep progress** on Team.

## Reference 3 — SBB Logistics truck management (RonDesignLab)
https://dribbble.com/shots/27035468-SBB-Logisctics-Truck-Management-Dashboard

Mostly stylised product renders rather than raw UI, so take **structure and air**, not surface:
- **Pill-shaped controls with a small coloured status dot on the left** — `● L 184 12 ⌄`. This is the
  single most repeated motif across all three references. Use it for stage chips, filters, and any
  selector. Thin 1px outline, transparent fill, generous horizontal padding, full pill radius.
- **Generously rounded cards** — 18–22px radius, larger than is currently used.
- **A lot of negative space.** Fewer things per screen, each with room. Do not fill the gaps.
- **One warm accent against near-monochrome.** In SBB it is a single orange against greys; here it
  is `#FFD84D` against charcoal — which only works if the yellow is *rare*.

### ⚠️ Resolving the conflict between the references
Haulix is dark, SBB is light. **The app stays dark** — Exceed's brand is charcoal + yellow and the
approved Login is dark. So: **surface treatment and data density from Haulix, structural rhythm,
radius and breathing room from SBB, indicator correctness from namethatui.** Do not build a light
theme.

## "Not too much text" — the client's words, treat as a hard constraint
- **Japanese stays, but only on labels and headers — never on every line.** Today's cards currently
  repeat the whole task in both languages. Keep the EN sentence, drop the JA duplicate of the
  sentence; keep JA on the field label and the screen title.
- Kill helper sentences that state the obvious. `"4 open tasks for Chiaki Nakamura"` becomes
  `4 open · Chiaki`.
- No paragraph anywhere on a list screen. If something needs a paragraph it belongs in detail.
- Empty states: one short line, not two.

## Type scale — use exactly these, nothing between
`28/700` screen title · `20/700` section title · `15/600` primary row text · `13/500` secondary ·
`11/700` pill · `10/800 +.08em uppercase` micro-label. Line height 1.35 for body, 1.1 for numbers.

## Spacing
4pt grid. Card padding 14. Gap between cards 10. Screen horizontal padding 16 on phone, 24 on iPad.
Section gap 28.

## Hard constraints — do not break these
- **No behaviour changes.** Do not touch `src/api/`, `src/auth/`, `src/navigation/` logic, any
  permission check, or any endpoint call. This is presentation only.
- **No new dependencies.** Use `react-native-svg` (already present) for bars and glyphs.
- `npx tsc --noEmit` must stay clean.
- Keep every state that exists — loading, empty, error+retry — improve how they look, do not remove.
- **LoginScreen.tsx is approved and locked. Do not restyle it.** It already matches this language.
- iPad: content columns stay capped (`MAX_CONTENT_WIDTH` in theme.ts); never stretch a form.
- Every control that works today must still work. No control may become decorative.

## Where to work
`/Users/a44/code/exceed-box-ios/src/theme.ts` (extend tokens), `src/components/*`, `src/screens/*`.
Prefer fixing shared components — `TaskCard`, `LeadListItem`, `Badges`, `ScreenHeader`,
`StateViews`, `BarList`, `TrendChart` — so every screen improves at once.

## Done means
`npx tsc --noEmit` clean, and a short list in your final message of exactly which components you
changed and what visual rule each now follows.
