# RepoPilot — Design Language

## Status
This document **supersedes the Design Requirements Document (DRD) for all UI
work**. The user explicitly dropped the DRD on 2026-10-21 ("design requirement
document ko chor, khud se better UI/UX bana"). The dark-first #0B0D10 /
#A78BFA system is retired. Product behaviour, scoring rules, API contracts and
data honesty rules are unchanged — only the visual language changed.

## Concept — "Material Expressive engineering studio"
What a senior Google design-engineer ships today: a light-first, warm,
confident tool that feels like a studio instrument, not a dashboard template.
Expressiveness comes from shape, tone and motion — never from decoration.

## Colour
- Warm paper background `#FAF9F6`; ink text `#191C1E`.
- Surfaces separated by **tone**, not borders: surface container `#F0EEE9`,
  elevated container `#E7E5DF`, same paper for the page itself.
- One seed accent — deep indigo `#3B4FD8` — used as **solid fills only**
  (primary buttons, the score arc, selected states). Tonal indigo container
  `#E0E4FF` for selected / hover / chip states.
- Semantic solids: success `#1B7A43`, warning `#B25E09`, danger `#B3261E`,
  info slate. AI status honesty is unchanged: not-configured Gemma shows
  amber (warning), never green.
- Dark theme (toggle in the top bar, persisted): tonal dark surfaces based on
  `#121417` with a lifted indigo `#8B9BFF`. Same class vocabulary via CSS
  variables (`app/globals.css`), Tailwind `darkMode: "class"`.

## Shape
- Large expressive radii everywhere: cards 24px, panels 28px, hero panels
  36px, inputs 16px, buttons and chips fully pill.
- The sidebar is a **floating rounded panel** with soft shadow and pill
  navigation (tonal indigo selected state), not a full-height bordered strip.
- Soft shadows only on floating elements (nav, sidebar, preview, drawer).

## Type
- Inter via next/font: big, tight display sizes for headlines and the health
  score (tracking −0.02/−0.03em).
- JetBrains Mono for code, paths and identifiers; tabular numerals for every
  score and metric that gets compared.

## Signature elements
- **ScoreRing**: the health score as a huge numeral inside a thick indigo arc
  that sweeps to the score on mount / repo change, wrapped by a segmented
  outer ring — one segment per scoring category, length = earned share of its
  weight, coloured by that category's health tone.
- **Severity** as filled tonal pills (soft semantic fill + dot + label, never
  colour alone).
- **Landing hero**: asymmetric editorial layout; the repo URL lives inside a
  big pill field on a tonal surface; the product preview floats on a tonal
  container with soft shadow, showing the real recorded analysis
  (encode/httpx, 95.5 — "Recorded live analysis — captured 2026-10-21").
- **Visual Debugger**: three tonal panels (intake / viewer / inspector),
  staged progress, before/after slider with a white pill thumb, and the issue
  publish button stays disabled until the confirmation checkbox is ticked.

## Motion
- 200–400ms, `cubic-bezier(0.22, 1, 0.36, 1)` spring for interactive
  elements; score arc sweeps ~1.1s; bars grow on mount.
- `prefers-reduced-motion` disables transitions and animations globally.

## Don't
- No gradients (especially purple-blue), no glassmorphism, no orbs, no neon.
- No old DRD palette (#0B0D10 / #A78BFA), no sharp 8px corners, no
  hairline-border dashboard grids, no emoji in the UI.
- Never present recorded or sample data as live; the amber "not configured"
  state for Gemma stays honest.
