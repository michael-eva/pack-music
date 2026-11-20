# Bug log review: 22 intern findings

I read all 22 rows of the interns' log. Below, each one is sorted into: fix now, add as a wireframe, or keep as is (with the reason). Nothing here uses AI or Cloud, so it stays within your current "no AI or Cloud" decision.

## 1. Fix now (bugs and readability)

- **#2, #6 Invisible text in boxes** (Join the Pack, Co-op Rules, profile, Your Site): set every text box to a light background with black text across the app. High priority.
- **#16 "Back to Example Café" when you never visited it**: replace with a plain "Back" button that returns to the page you came from (home if there isn't one).
- **#14 Two different bottom bars**: use one listener bar everywhere (Home, Library, Map, Me). "Saved" sits inside Library and venues are reached from Map/Home.
- **#17 No direct way to an artist**: make artist names under songs, and items in the Following section, tap through to the artist page.
- **#13 Player too big, controls below the fold**: shrink the album cover so cover, play/pause/skip and "Up next" fit on one phone screen; rename "Save" to "Save to library" so its purpose is clear.
- **#1 "Heard at" tag lost in playlists**: keep the "Heard at [venue] · [date]" chip on songs inside playlists. (The log still names the old tab "Heard somewhere real"; it's now "Playlists I've pinched".)
- **#15 Business player**: centre the now-playing card and add Pause/Play for staff.

## 2. Add as wireframe screens

- **#3 Full artist agreement**: a new page that "Read the full agreement" opens, with headings and placeholder clauses marked as draft.
- **#9 Business playlists**: a list of the business's playlists plus a "New playlist" button with name + add songs (following the playlist rules).
- **#12 Search** (High): a search box on the listener home for artists, songs and venues. Results are plain matches by name, with no ranking or "recommended", so it doesn't break the no-algorithms principle.
- **#21 Contact The Pack** (High): a Contact/Help page linked from Me, the artist portal and the business menu, with topics (account, upload status, payments). Email shown as a placeholder.
- **#7 Venue photo**: an optional upload spot on Your Site. If there's no photo, show initials on a brand-colour circle.
- **#19 Earnings statement**: group by song, with an expandable row per venue, instead of one row for every song-and-venue pair. Totals and "Show working" stay.

## 3. Security improvements (shown in the wireframes; real enforcement comes with a real sign-in system)

Sign-in in the app is currently a placeholder that accepts any email, so these are shown as the intended design:
- **#4 Password strength**: require 12+ characters with a live strength meter and a check against commonly used passwords. Length plus a blocklist is current best practice (stronger than forcing symbols).
- **#20 Two-step sign-in**: a "Turn on two-step sign-in" option in settings using an authenticator app 6-digit code. Required for admins and artists (who have earnings), optional for listeners.
- **#22 Bank details**: no screen where people type bank details into The Pack. Instead a "Set up payouts with Stripe" button (artists) and "Manage payment card" (listeners/businesses) that hand off to Stripe, so The Pack never holds card or bank numbers. Labelled Phase 2 / simulated, consistent with the Payments page.
- **#5 Is the ABN real?**: after an ABN is entered, show "Checked against the Australian Business Register" with the registered business name for the owner to confirm. Real check uses the government's free ABN Lookup service later.
- **#11 MetaGen connection**: add step 2 on Join & Checklist: "Connect your MetaGen Creator ID", with an unticked consent box listing exactly what The Pack will receive (profile, identifiers, track details, splits). Rights stay captured in MetaGen, not in the app.

## 4. Keep as is (with the reason to record in the log)

- **#8, #18 Private vs public follows**: the scope draft keeps listeners private unless they choose to follow publicly; this is a privacy principle you chose last time. Suggested response: keep, but on My Site show a follower count plus at most a few public names with "and N more", which solves the "too packed" worry.
- **#10 Map is a placeholder**: correct, it's labelled Phase 4 preview. A real map waits for Phase 4.

## Details I'll make up unless you tell me

Contact email (hello@packmusic.au), the 12-character password rule, and two-step being required for artists and admins.

## Technical notes

- Input fix: one shared style rule for `input`, `textarea`, `select` inside `.pk` journeys.
- Back button: history-based with home fallback; one shared listener tab bar component.
- Search filters the existing demo songs/artists/businesses by name, client-side.
- Security items are presentation only in `pack-auth.ts` and screens; no Cloud usage.
