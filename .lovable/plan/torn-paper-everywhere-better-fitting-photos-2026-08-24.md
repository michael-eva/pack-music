# Torn paper everywhere + better-fitting photos

Two changes: extend the organic torn-paper edge to every card, panel and photo frame across the site, and re-fit the page photos so they fill the space they sit in.

## 1. Torn edges on all boxes and pictures

Right now only a few elements use it (the "torn" photo variant, the About/Join panels, tape strips and cut-out labels). Everything else — flyer cards, accordions, blog cards, polaroid and cut-out photo frames, the "Photo" placeholder slot, speech bubbles' siblings — still has clean rounded rectangles.

The plan applies the same fibrous torn edge to:

- Flyer/point cards (the taped cards on Home, Artists, Listeners, Partners)
- Library accordion panels and FAQ folds
- Blog cards and blog article body panel, including the empty "Photo" slot
- All three photo treatments (taped polaroid, torn, cut-out), so every picture on the site has a hand-torn paper border
- Board member photos and any remaining paper panels

To keep depth, the paper background gets the torn mask while the content stays unmasked, and the drop shadow follows the torn silhouette instead of a rectangle. Several noise seeds are used so no two boxes are torn identically, with slight edge variation left/right/top/bottom rather than the same shape repeated.

## 2. Photos sized to their space

Photos are currently capped at one small fixed width (`max-w-sm`) with a fixed 6:5 crop, which is why they look undersized inside wide half-page columns.

- Photos fill their column on tablet and desktop, with a sensible cap so they never blow out on very wide screens
- Crop adapts to placement: wider landscape crop in half-page columns, taller crop in narrow side columns, so the frame doesn't leave dead space
- Page-by-page pass over Home, About, Artists, Listeners, Partners, Join and Board to balance the photo against the text next to it (vertical alignment, matched column heights, consistent gaps)
- Blog card cover slots get a consistent aspect ratio instead of a fixed pixel height, so cards in a row line up

## Technical notes

- `src/styles.css`: add a `torn-paper` / `torn-frame` utility pair that masks a paper layer (`::before`) with the existing `--torn-mask-*` variables plus new seeded variants, and moves depth to `filter: drop-shadow()` so the shadow tracks the torn outline. Retire the rounded-rect look on `zine` in favour of the torn surface.
- `src/components/site/blocks.tsx`: apply the torn surface in `Point`, `TornPanel`, and all `PhotoSticker` variants; add a `ratio`/size prop so callers can pick landscape vs portrait framing.
- `src/components/site/Accordion.tsx`, `CoverSlot.tsx`, `blog.index.tsx`, `blog.$slug.tsx`: swap plain panels/placeholders to the torn surface and aspect-ratio-based covers.
- Route files (`index`, `about`, `artists`, `listeners`, `partners`, `join`, `board`): widen photo containers and adjust grid alignment.
- No content, data or backend changes.
