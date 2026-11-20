# The Pack streaming app wireframes

## Goal
Create a polished, clickable, mobile-first wireframe for The Pack’s main streaming app, covering listener, artist, and venue journeys with mocked content only. The separate admin tool is excluded.

## Experience to build

### 1. Shared app foundation
- Apply The Pack’s supplied identity: vivid blue, orange-red, cyan, hot pink, supporting green/yellow/peach, bold gradients, subtle soundwave particle textures, rounded display headings, and clean body text.
- Use Stanley sparingly for an empty/loading or success moment, never as navigation.
- Create a persistent mobile navigation system for Home, Discover, Library, and Profile, plus a compact persistent mini-player where appropriate.
- Make all journeys responsive, while prioritising a realistic phone experience and larger tablet controls for venue staff.
- Add tiered co-operative membership/subscription screens for listeners, artists, and venues, with benefits, pricing, and role-specific next steps presented clearly.
- Require every user type to complete co-operative membership enrolment and accept the Co-op Rules before joining their respective listener, music, or venue cohort; include rule review, acceptance, and confirmation states in each onboarding journey.

### 2. Listener journeys
- Email/password sign-up and login, with a magic-link option and no social login.
- QR arrival experience that opens directly to “Now Playing at Mojos” without a login wall.
- Live track card, upcoming queue, save interaction, confirmation state, and the distinctive “Heard at Mojos · [date]” memory tag.
- Artist and venue profiles with follow actions, tracks, venue details, recently played music, and opening hours.
- Gentle, dismissible account prompt after a guest’s second save.
- Human-curated Home and Discover views using labels such as “Curated by The Pack” and “Picked by Mojos,” never algorithmic recommendation language.
- Full player and queue, Library tabs, playlist creation, saved tracks, and followed artists/venues.
- Patron and “Where your money goes” screens explaining the 70/30 model in plain language.
- “Where to go tonight” planning view with a stylised mock map, venue pins, vibe filters, local artist filter, gig-calendar toggle, and venue detail access.
- Profile/Settings and “How we work” transparency screen, including a visible link to see held user data.

### 3. Artist journeys
- Artist onboarding for co-operative membership, Co-op Rules acceptance, legal name, stage name, and APRA/AMCOS membership status.
- Track upload with mocked drag-and-drop and basic release information, followed by a clearly labelled hand-off into a shared Pack/MetaGen catalogue.
- A MetaGen-hosted or embedded metadata step for writers, performers, identifiers, credits, copyright holders, release details, genre, and other descriptors, followed by a Pack-facing review/confirmation state rather than duplicate Pack data entry.
- A mocked processing timeline showing the intended integration points: transfer to MetaGen, metadata completion/validation and genre tagging by MetaGen, catalogue return/sync to The Pack, then mastering/loudness normalisation through MetaGen if supported or a separate ethical partner if required.
- For the Living Labs MVP, present MetaGen’s metadata and tagging work as human-reviewed rather than implying full automation.
- Plain-English licence-back agreement and signing step.
- Copyright-holder split editor that visibly validates a 100% total.
- Artist dashboard with mock play activity, track status, catalogue/metadata/mastering readiness, earnings, monthly $5 payout threshold, royalty explanation, bank-connection placeholder, and prominent “Export my data” action.

### 4. Venue journeys
- Venue onboarding with co-operative membership, Co-op Rules acceptance, venue name, photos, and vibe description.
- Honest venue licensing copy that discusses OneMusic only and keeps current venue obligations explicit.
- Simple subscription presentation based on number of sites, not plays.
- Separate tablet-oriented venue player with an unmistakable ON AIR state and skip-reason interaction.

## Interaction approach
- Use local mocked state so buttons, tabs, save/follow actions, filters, dialogs, upload steps, playlists, split validation, and venue controls visibly work.
- Keep navigation cohesive and provide clear ways back between linked screens.
- Use representative fictional Perth artists, tracks, venues, gigs, play counts, and dollar values; no real accounts, payments, uploads, maps, external processing, or streaming.

## MetaGen integration placement
- Treat MetaGen as the metadata layer between artist upload and The Pack’s streaming catalogue, not as a duplicate metadata form owned by The Pack.
- Mark integration boundaries in the artist flow and status screens so stakeholders can see what The Pack owns, what MetaGen may provide, and where a separate mastering service could connect.
- Include a lightweight “catalogue mapping” review state to show that The Pack’s final ingestion format is still being shaped with MetaGen rather than presented as settled.
- Keep unsettled collaboration details provisional: the wireframe will say “proposed” or “to be confirmed” for mastering, automation, API mapping, shared-database ownership, and operating costs; MetaGen’s ownership of metadata capture and management will be shown as confirmed.
- Use the resulting genre and descriptor fields in the mocked venue-playlist workflow, demonstrating how human-reviewed catalogue data supports curated playlists for different business types.

## Membership and licensing boundaries
- Show co-operative membership as a prerequisite across all user types, with tiered subscriptions adapted to listeners, artists, and venues rather than one generic payment screen.
- Keep membership acceptance separate from commercial payment setup and separate again from music licensing permissions.
- APRA AMCOS wording appears only in musician onboarding, membership status, and track licence-back flows.
- OneMusic wording appears only in venue onboarding and venue licensing guidance.

## Technical approach
- Build the app as a set of shareable TanStack routes supported by reusable app-shell, media, profile, player, form, and status components.
- Define semantic colour/type tokens in the global styles and use bundled or suitable fallback typography where licensed source files are unavailable.
- Recreate brand texture and Stanley-inspired accents from the supplied visual reference without embedding the guide pages themselves as interface artwork.
- Add unique page metadata for each content route.
- Verify the complete journey in the live preview at desktop and mobile widths, including interactive states, navigation, legibility, and layout stability.

## Out of scope
- Admin/moderation tool.
- Live authentication, backend storage, Stripe, MetaGen or mastering APIs, automated metadata/genre analysis, audio streaming, real map data, and production payments.
- Government/NFP onboarding, jukebox requests, merch/tickets, social graph, governance, multilingual support, offline listening, analytics export, custom artist domains, and the musician support loop.
