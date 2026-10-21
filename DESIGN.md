# RepoPilot — Design Language

## Direction

RepoPilot should feel like a serious open-source engineering instrument, not
an AI landing-page template. The interface is evidence-led, compact and calm.
Product behaviour, scoring rules, API contracts and data-honesty rules are
unchanged by the visual system.

## Principles

1. **Evidence before decoration.** Real repository names, scores, paths and
   findings carry the interface. Avoid decorative dashboard filler.
2. **Rules decide; AI explains.** Copy and status treatments must preserve the
   distinction between deterministic scoring and Gemma-generated explanation.
3. **Editorial hierarchy.** Use strong type, measured whitespace and simple
   rules/dividers instead of repeated floating cards.
4. **Quiet interaction.** Motion is short and functional. Reduced-motion
   preferences disable non-essential animation.

## Visual system

- Warm paper canvas `#F4F1EA`, off-white surface `#FFFEFB`, ink `#1B1C18`.
- Burnt orange `#E35D32` is the only brand accent. It is reserved for focus,
  section markers and high-value interaction states.
- Borders use `#D5D0C5`; shallow offset shadows are used sparingly for tactile
  form and analysis surfaces.
- Inter is the interface face. JetBrains Mono is limited to paths, commits,
  scores and technical metadata.
- Corners stay modest (generally 4–12px). Avoid pill-heavy navigation, giant
  radii, glass effects, gradients and ornamental glow.

## Layout signatures

- The landing page pairs direct, concrete copy with a recorded analysis
  artifact. It does not use fake browser chrome.
- Feature explanations use numbered rows and editorial divisions rather than
  a grid of interchangeable icon cards.
- Forms stack cleanly on narrow screens and never introduce horizontal page
  scrolling.
- Dashboard screens share the same warm neutral tokens while retaining dense,
  readable tables and code-focused details.

## Content rules

- Prefer concrete terms such as “repository”, “file tree”, “commit” and
  “finding” over vague phrases such as “mission control” or “supercharge”.
- Never present recorded/sample data as live.
- Never imply that AI creates the health score.
- Do not invent customer logos, testimonials, usage numbers or awards.
