# Retro DIY pass: photos and sections

Take the retro/zine feel further using the new inspiration only as mood reference — no copied layouts, no new colours outside the Pack palette.

## Photos and mascots

- Cut-out collage treatment: replace the uniform polaroid frame with a mix of three treatments applied per image — torn-paper edge cut-out, photocopied polaroid with handwritten-style caption, and a plain sticker cut-out with hard offset shadow.
- Slight random tilts (-3deg to +3deg) and overlapping placement so photos feel pasted, not gridded.
- Push the xerox/halftone treatment harder on photos: raised contrast, subtle paper-yellow tint, grain over the top.
- Stanley GIFs stay untouched — no outlines, filters or frames on them.

## Sections

- Sections read like zine spreads rather than stacked bands: staggered column widths, occasional off-axis blocks, wider gutters.
- Add cut-and-paste furniture used sparingly: torn paper strip edges between sections, a checker strip accent, cut-out "ransom" kicker labels in Space Mono, and small stamps/asterisks.
- Keep the one-gradient-per-page rule and the wave-particle texture; the collage sits on top of the gradient.
- Body copy blocks get an aged-paper card with a torn top edge instead of a plain rounded card.

## Technical notes

- New/updated utilities in `src/styles.css`: `torn-top`, `torn-edge`, `checker-strip`, `cutout-label`, plus stronger `xerox` values.
- `src/components/site/blocks.tsx`: `PhotoSticker` gains a `variant` prop (`polaroid` | `torn` | `cutout`) with deterministic tilt; new `TornPanel` and `CutoutLabel` blocks.
- Route files (`index`, `artists`, `listeners`, `partners`, `about`, `join`) updated to use the new variants and staggered section layout.
- No copy changes, no backend changes.
