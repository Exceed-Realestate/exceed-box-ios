# Brief v2 — Exceed Box app icon, derived from the REAL Exceed mark

**Your previous attempt was rejected as generic.** It was — because the earlier brief never showed you
the company's actual logo and told you to invent a wordmark instead. That was the error. This brief
fixes it. **Everything you draw must descend from the existing Exceed mark.** No new metaphors, no
invented symbols, no stock "box + arrow" iconography.

## Look at the logo first — this is mandatory
`exceed_logo.jpg` is in this folder. **Open it and study it before drawing anything.**

What it is, so you cannot misread it:
- A **square rotated 45° — a diamond** — drawn as an **open outline**, not filled
- The outline is **broken / open at the upper right**
- **Inside it, an angular stepped form** of the same stroke weight — reads as a stylised `E`,
  built only from straight segments meeting at 45° and 90°
- A **small separate chevron floats outside the diamond to the right**, pointing up and out. That
  detached chevron is the "exceed" gesture — the thing escaping the frame
- **Uniform stroke weight throughout. Sharp mitred corners. Not one curve anywhere.**
- White on navy

## Exact brand colours
- **Exceed navy `#002E52`** — the true corporate colour, taken from the logo file itself
- White `#FFFFFF`
- Product accent yellow `#FFD84D` and gold `#F0B429` — used across Exceed's internal tools
- Charcoal `#15171C` / `#1C1F26` — the internal-tool surface colour

⚠️ Note the tension and use it deliberately: the **corporate mark is navy/white**, while **Exceed's
internal tools are charcoal/yellow**. Some variations should be navy (true to the company), some
charcoal-and-yellow (true to the tool family). Do not blend them into mud — pick one per icon.

## The design problem
This is the icon for **Exceed Box**, an internal sales-cockpit app used daily by ~10–15 Exceed staff
in Dubai and Tokyo. It must read as **unmistakably an Exceed product** — someone glancing at the home
screen should recognise the company before they read the label — while being distinct from other
Exceed apps that will follow.

## The 12 variations — all derived from the mark
Every one must reuse the mark's actual DNA: **the 45° diamond, the uniform mitred stroke, the
stepped inner form, or the escaping chevron.** Ideas to develop and improve:

1. **The mark, untouched**, optically re-centred for an icon, white on navy.
2. **The mark, untouched**, in yellow on charcoal — the tool-family reading.
3. **Simplified for small sizes** — diamond outline + escaping chevron only, inner form dropped.
4. **The diamond as a container** with one solid cell sitting inside it — box meaning, mark's geometry.
5. **The escaping chevron alone**, enlarged to fill the icon — the boldest possible crop of the brand.
6. **Two-tone split** — diamond in white, escaping chevron in yellow, on navy.
7. **Knockout** — solid yellow field, the whole mark cut out of it in charcoal.
8. **The inner stepped `E` form alone**, enlarged, diamond removed.
9. **Diamond with the stroke thickened dramatically** so it survives 60px, chevron still detached.
10. **The diamond rotated back to a square**, keeping the stepped form and chevron — a quieter,
    more "app-like" sibling of the corporate mark.
11. **A stack of three diamonds** receding, the top one broken open — leads flowing into the box.
12. **The mark with the chevron doubled**, two escaping strokes instead of one.

**Corner crops of the real mark are strongly encouraged.** A brand icon does not have to contain the
whole logo — it has to be recognisably built from it.

## Icon craft rules — these decide the winner
- **Full-bleed square, no transparency, no rounded corners of your own.** iOS applies its own
  superellipse mask. Draw to a 1024×1024 viewBox, artwork inside a centred ~820×820 safe area.
- **Two tones maximum**, three only if the third is doing real work.
- **It must survive 60×60.** The real mark's stroke is thin — at icon scale it will disappear.
  **Thicken it.** Strokes ≥ 48 units at 1024 scale. This is the single hardest constraint here and
  most of your variations will live or die on it.
- **Optical centring, not mathematical.** A rotated diamond centred by maths sits low and left.
- Banned: photographs, buildings, skylines, gradient meshes, glassmorphism, blur, inner shadows,
  3D bevels, skeuomorphism. Flat colour and exact geometry only.
- **No external requests.** Everything inline SVG. Must render fully offline.

## How to present them
`/Users/a44/code/exceed-box-ios/design/icon/icon-variations.html` — overwrite it. One file.

- Page background: neutral dark grey, clearly not the app
- **At the very top: the original `exceed_logo.jpg` shown at 200px**, labelled "source mark", so the
  lineage of every variation can be judged against it at a glance
- A grid of 12. Each: icon at 200px with the iOS superellipse mask, its number, a 3–5 word name, and
  **one line naming which part of the source mark it descends from**
- Under each, the same icon at **120 / 80 / 60px** in a row — the honesty check, not optional
- A **light-background strip** — all 12 at 80px on `#F6F7F9`
- At the bottom, a **simulated iPhone home screen**: charcoal wallpaper, 4-column grid of grey
  placeholder icons, your **three strongest** dropped in, labelled "Exceed Box" in iOS style

## Quality bar
This goes on the CEO's phone, and it represents his company. Precise geometry, exact angles,
deliberate stroke weights, correct optical balance. One confident idea beats a busy composition.

When done, print only the absolute path of the file you wrote.
