# Fix text clipping on the Board page

## What I found

I loaded the Board page in the preview and opened every director's card. The biographies are all present, but on each card the text runs right up to — and past — the jagged torn edge of the paper, so words get visually cut off at the sides. This happens because the torn-paper cards only have a small inner margin (about 24px), and the torn bite of the paper edge is deeper than that in places. The same cards are used on the FAQs and other pages, so they have the same issue.

## What I'll change

1. **Give the fold cards more breathing room** — in `src/components/site/Accordion.tsx`, increase the inner padding on the card header and body (from 24px to roughly 32–40px on each side) so text always sits well inside the torn edge, on every card, at every screen size.
2. **Slightly grow the paper behind the card** — in `src/styles.css`, widen the paper layer behind each torn card a touch so the torn bite starts further from the text.
3. **Check the other torn text boxes** — apply the same extra padding to the torn info panels (like the "Want a say in who sits here?" box at the bottom of the Board page) if they show the same crowding.

## How I'll verify

Re-screenshot the Board page at desktop and phone widths with all cards open, and confirm every bio sits fully inside its paper with clean margins — plus a quick check of FAQs and other pages using the same cards.
