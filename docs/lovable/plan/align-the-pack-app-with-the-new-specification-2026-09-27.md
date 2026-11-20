# Align The Pack app with the new specification

## Decisions already agreed
- Business pricing: flat $49.99 per site for the pilot/test period. Turnover tiers stay visible as the plan after the pilot, clearly labelled "after the pilot".
- Patron fund: keep "Music industry development fund" with $2, $5, $10, $15 chips (replaces the spec's "Foundation" wording and $5/$10/$20).
- Scope: add the Curator and admin journey; keep the Government pathway and the artist Band Page tier.
- Look: Nunito Bold headings, Inter body. Spec colours only. Gradient squares for artwork (no photos). Dot-wave texture on hero areas only. Stanley placeholder only for loading/empty states.
- Seed data: Example Café, Corner Books, Harbour Salon; The Southerlies, Marlo Finch, Dune Season; the listed songs; Alex (curator), Sam (admin), Sam Reilly (songwriter).

## Shared foundation
- One browser-saved app store seeded with the spec data: saves, playlists, follows, releases, suggestions, audit log, settings.
- Test mode setting, on by default. When on, every money figure shows "(simulated)" and businesses see the dashed amber free-trial note.
- Reusable orange "MetaGen side" band with one switch that hides all of them.
- Simple sign-in: any email, then a "Check your email" screen, then continue. No social sign-in.
- Start screen keeps the four-pathway circle, plus a link to the Curator/Admin area.
- Global language check: "Curated by" / "Chosen by" labels only; no listener names shown to artists or businesses except public followers' display names.

## Journey A: listener in a business (phone)
- /c/exa "What's playing here" with no login; tappable business and artist; "Curated by Alex & The Pack"; "Nothing playing right now" state.
- Save sheet (email link or password), guest prompt after saving.
- /artist/the-southerlies: bio, region, songs (title and length only), no play or follow buttons, "Back to Example Café".
- /business/example-cafe: hours, vibe, Playing now with ON AIR, recent artists, "Suggest a song for this space" sheet.
- /saved "Heard somewhere real" with "Example Café · Sat 19 Sep" tags, remove, Stanley empty state; tabs Saved, Businesses, Me.

## Journey B: business (tablet/desktop)
- "Before you switch on The Pack" notice with unticked checkbox gating Continue; OneMusic honesty.
- "Your site" with fields, QR/short link and sign kit, Staff panel, Followers panel (public names plus quiet count); left menu Player, My site, Playlists, My plan, Staff.
- Landscape player: pulsing ON AIR, playlist version, skip plus reason chips, volume trim, Up next (2), QR panel, "Keep your OneMusic licence", "Offline, still playing" note.
- "Your plan": $49.99 per site (pilot), $34.99 / $15.00 bar, post-pilot turnover tiers shown as future.
- Playlists: Pack playlist first, staff house picks, swap button, listener suggestions with Add, share button.

## Journey C: artist (desktop first)
- Invite-based Join: account and terms, Co-op Rules as a Full member, checklist with Add your music locked until profile and agreement are done.
- Profile with private legal name and live preview; Artist Agreement (four blocks, APRA AMCOS licence-back), acceptance saved with the date.
- Add your music: MetaGen band, receiving progress from MetaGen (no pause), rights position, confirm checkbox, Submit leads to status chips Received, Checking, Needs attention, In review, Live.
- Release status timeline with E204 / E520 / E730 cards, and version 2 wording.
- "Who gets paid for Night Bus" read-only splits (Sam Reilly 60%, Jo Tan 40% held).
- Dashboard: plays, earnings (simulated), followers 34 (21 public, 13 quiet), Export data, Withdraw release with confirmation. Band Page upgrade kept.
- August 2026 statement with the worked $15.74 / $9.44 example, CSV button, $10 payout threshold.

## Journey D: curator and admin (desktop, new)
- Menu: Dashboard, Review queue, Playlists, Sites, Users, Policy, Audit log.
- Users: invite artist / business forms and status table.
- Review Kestrel Road v2: check chips, track table with play buttons, Approve disabled until every track has been played, Hold/Reject require a reason; curator view hides the decision buttons.
- Playlist builder: filters, matches, "Curated by Alex & The Pack" with rule chips, Suggested (Auto-surfaced / Listener), Assign to, Publish, exposure note.
- Sites table: "2 of 3 on air", skip reasons line.
- Policy: Test mode switch affecting every money screen at once, editable settings with Last changed, feature flags, audit log entries.

## Journey E: listener at home (phone)
- Tabs Home, Library, Map, Me. Home with "Tuned to: Folk, Indie" chip and named-curator sections; Following row.
- Full-screen player with Heard-at chip, Add to playlist, draggable Up next.
- Library tabs: Heard somewhere real, Playlists, Following; "Only you can see your library."
- "Where your $9.99 goes": $6.99 / $3.00 with the exact artist breakdown; patron box using the development fund and current amounts.
- Map with pins, filters, separate Gig calendar, pin sheet with ON AIR and upcoming gigs.

## Kept but not in the spec
- Government pathway and its membership tier; artist Band Page ($10/month).

## Technical details
- New store module (React context plus localStorage) and auth module; routes rebuilt to the spec paths (/c/$code, /artist/$slug, /business/$slug, /saved, /biz/*, /artist-portal/*, /admin/*, /home, /library, /map, /money, /player). Old routes redirect or are removed.
- Nunito loaded in the root head; Fredoka / Shantell rough-text styling removed.
- Build journey by journey (foundation, A, B, C, D, E), checking each in the preview.
