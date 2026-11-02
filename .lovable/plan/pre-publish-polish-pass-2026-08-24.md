# Pre-publish polish pass

A round of content, layout and bug fixes across the site.

## Bugs

**Blog posts don't open.** Confirmed cause: the blog list page is a parent route of the post page, and it doesn't render a child outlet, so clicking "Read it" changes the URL but keeps showing the list. Fix by moving the list into its own index route so post pages render properly.

**Board photos.** Board members currently have no photo field anywhere (not in the database, not in the admin, not on the page). Add a photo to each board member: a new image field, an upload control in the admin board editor, and a consistent circular/polaroid headshot on the Board page with a neat fallback until photos are uploaded.

**Library links.** Papers and policies open in the same tab; switch them to new tabs (with safe rel attributes).

## Homepage

- Remove the "Stanley says" bubble.
- Remove "The numbers" section entirely.
- Tighten the layout so the page reads denser: reduce oversized vertical gaps between sections, and rebalance the hero so the photo and copy fill the width better on large screens.

## Copy and typography

- Replace every em dash across the site with an en dash, or a comma where that reads better.
- About page: "structure" becomes "business model".
- Remove the "Stanley says" lines from Artists, Listeners and Partners.

## Layout consistency

- Standardise the gap between a page title and the paragraph beneath it, applied in the shared hero component so all pages match.
- Fix the large gap under the title on Our Story.
- Give all page photos one consistent size and frame treatment.
- Remove the checkered divider (About page uses it; the component goes too).

## Readability

- Make body text black on light backgrounds (light green, peach, yellow pages) rather than the current washed-out tone.
- Partners: the "For local government" heading and copy move from yellow to dark ink for contrast.
- Partners: the three "blank" boxes in the local government section aren't empty - they already contain the LGA spend, reporting and funding-gap lines, but the text is set in a near-white tone on a cream card, so it disappears. Switching those cards to dark ink text makes the copy visible.

## Technical notes

- Route change: `src/routes/blog.tsx` becomes `src/routes/blog.index.tsx` so `/blog/$slug` renders.
- Migration: add a `photo_url` column to `board_members`, plus a public storage bucket policy for board images; extend the admin board form with an image upload.
- Shared spacing tokens live in `PageHero` / `Slab` in `src/components/site/blocks.tsx`; `CheckerRule` is deleted.
