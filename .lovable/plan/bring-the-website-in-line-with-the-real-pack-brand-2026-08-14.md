# Bring the website in line with the real Pack brand

I reviewed the Drive folder (app mockups, blank templates, banners, general posts, thumbnails). Good news: the colours are already exactly right. The problem is *how* they're applied — the website uses a hard-edged poster style that doesn't appear anywhere in your actual brand material.

## What the Drive material actually looks like

- Full-bleed smooth gradients as the base of nearly every asset: blue → magenta, orange → yellow, cyan → green → yellow, pink → peach.
- A halftone dot "wave" texture flowing across those gradients — it's on almost every template, banner and post.
- Duotone photo cut-outs of musicians (blue/yellow or blue/pink), with a thick white sticker outline.
- Rounded shapes: pill buttons, rounded speech-bubble callouts, a `PACKMUSIC.AU` pill lockup at the bottom.
- Headline type set in heavy uppercase, usually electric blue on gradient (not black).
- The app UI itself is dark purple/near-black with purple accents — a distinct "product" mode.
- Sampled colours confirm the guide: `#0214ff`, `#ff2cdf`, `#ef4823`, `#ffe53b`, cream `#fff6e5`.

## Where the website diverges

| Site now | Brand material |
|---|---|
| 3px black borders + hard offset black shadows on everything | No black outlines anywhere; white sticker outlines on cut-outs only |
| Zero corner radius, square blocks | Pill buttons, rounded bubbles, rounded cards |
| Flat solid colour panels (yellow/cyan/green cards) | Gradient fields with halftone texture |
| Cream page background dominant | Gradient-dominant, cream used as accent/bubble fill |
| AI-illustrated Stanley + stock gig photo | Duotone cut-out photography of real musicians |
| Fredoka headlines in black | Heavy uppercase headlines, usually electric blue or white on gradient |
| No `packmusic.au` pill | Pill appears on nearly every asset |

## Proposed changes

1. **Gradient + halftone system.** Add a reusable halftone-dot overlay and apply the brand gradients as full-bleed section backgrounds, replacing flat cream/solid panels as the default surface.
2. **Retire the hard poster style.** Remove the 3px black border / offset black shadow treatment and square corners. Cards become soft-edged gradient or cream panels; buttons become pills; callouts become rounded speech bubbles like the "we're not here for viral" post.
3. **Headline treatment.** Switch headlines to heavy uppercase with electric blue on light/gradient grounds and white on deep blue, matching the templates. Keep Fredoka as the Gothiks Round stand-in.
4. **Imagery.** Replace the illustrated hero art with duotone musician cut-outs in the brand style (blue/yellow, blue/pink) on gradient, keeping Stanley as the logo mark and for the "Stanley says" moments rather than as the hero. I'll pull suitable source images from your Drive folders where they fit.
5. **Recurring brand furniture.** Add the `PACKMUSIC.AU` pill to section ends, and use the stacked `pack music/` logo lockup at the sizes it appears in the banners.
6. **Section-by-section pass** across home, artists, listeners, partners, about and join so the gradient pairings rotate the way they do across your social set, rather than repeating one.

## Technical notes

- All work is in `src/styles.css` (new halftone utility, radius tokens, revised block utilities) and the route/component files; the colour tokens themselves stay as they are since they already match.
- The `block-hard` / `block-hard-sm` / `press` utilities get replaced with soft equivalents; every usage across the six routes and `blocks.tsx` gets updated.
- No backend, form or data changes — the signup flow stays exactly as it is.
- Brand imagery pulled from Drive gets added under `src/assets` as optimised web images.

## Open question

The app mockups use a dark purple/near-black UI, which is a different mode to the bright gradient marketing look. I'll keep the marketing site in the bright gradient mode and use the dark mode only where app screens are shown — say if you'd rather the site lean dark.
