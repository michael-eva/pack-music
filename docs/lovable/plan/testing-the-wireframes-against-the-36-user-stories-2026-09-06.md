# Testing the wireframes against the 36 user stories

I walked every screen against your list. 17 stories are covered, 4 are partly covered, 15 have no screen yet. Below is the audit, then what I'd build to close the gaps.

## Covered today

- Arrive at a venue screen with no login wall, current track in one card, one-tap save, "Heard at Mojos · 6 Sep" tag (2, 3, 4, 5)
- ON AIR indicator and one-tap skip with a reason (9, 10)
- Human-curated home feed, clearly labelled (12)
- Patron add-on tiers (17)
- Plain-English licence-back, copyright splits, royalty explainer, earnings figures, export my data (22, 23, 25, 27)
- Honest OneMusic / APRA AMCOS positioning for businesses (29)
- Venue map, vibe filters, venue pins (31, 32 partly, 33 partly)

## Partly covered

- 6 / 14: tapping an artist opens the artist's own workspace, not a listener-facing artist profile
- 16: playlists show an empty state only — you can't create one or see tracks inside
- 24: "2 awaiting review" appears as a number, but there's no per-track status list
- 32: vibe and local-artist filters exist; the gig-calendar toggle doesn't

## Missing

QR arrival sign (1), listener venue profile with vibe/recent artists/hours (7), guest save prompt (8), email + magic-link sign-up (11), full-screen player with queue (13), follow buttons on profiles (15), "where your money goes" 70/30 screen (18), artist sign-up with legal name and APRA/AMCOS status (19), auto-suggested genre/BPM/mood tags (20) and confirming/correcting them (21), payout bank connection (26), business page setup with photos and vibe (28), venue pin leading to a profile with upcoming gigs (33).

## What I'd build

1. **Listener entry and profiles** — a QR/venue-sign arrival screen; a public artist profile (bio, tracks, follow) and a public venue profile (photos, vibe, hours, recent artists, upcoming gigs) reached from the now-playing card and the map pins; follow buttons that visibly toggle.
2. **Accounts** — an email/password + magic-link sign-in screen (no social buttons), plus the gentle "save your saves" prompt after a guest's second save.
3. **Listening** — a full-screen player with queue, and working playlists: create one, add saved tracks, "Heard at" tags still visible inside.
4. **Money transparency** — a "where your money goes" screen showing the 70/30 split in plain English, linked from Profile and from the patron add-on.
5. **Artist flow** — an artist sign-up step for legal name, stage name and APRA/AMCOS status; suggested genre/BPM/mood tags in the MetaGen step that the artist can confirm or correct; a catalogue list with pending / live status per track; a payout setup screen for bank connection above the $5 threshold.
6. **Business flow** — a business page setup screen (photos, short vibe description, hours) feeding the public venue profile.
7. **Discover** — add the gig-calendar toggle alongside the existing filters.

## Two things to confirm

- **Story 30 asks for pricing by number of sites. Your later direction was tiered by annual turnover. I'll keep turnover-based tiers and show multi-site as an add-on, unless you'd rather flip it.**
  **Story 17 says patron money goes to "the Foundation"; the current screens say "music industry development fund". I'll use one name consistently — tell me which.**
  **Stories 34-36 (admin) stay out of scope, as agreed. Say the word and I'll wireframe the admin queue separately.**
  **Technical notes**

New routes: `/scan`, `/sign-in`, `/player`, `/money`, `/artists/$slug`, `/venues/$slug`, `/artist/setup`, `/artist/payouts`, `/business/setup`. Each gets its own `head()` metadata. All state stays mocked in local component state; no auth, payments or streaming. Shared profile, player, form and status components extend the existing `PackApp` pieces and the current colour and type tokens.