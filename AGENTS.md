# Working on The Pack

- The scope is `Pack MVP Scope from Michael.md`. Requirement IDs (ACC-3, PAY-4, ...) and wireframe IDs
  (A1, B3, ...) in code comments point at it.
- This app started as Mel's Lovable prototype and now runs on its own (no Lovable build config,
  hosting or Cloud). Mel's plans and the interns' bug-log triage are in `docs/lovable/`.
- The database is the shared Supabase project PackDatabase (`acrpbszosnpvgbryriou`). The interns own
  the payments tables there (payer, play_event, ledger, payout, ...). Agree schema changes with them
  before touching shared tables.

## Current state

- App data still lives in one browser-saved store (src/lib/pack-store.tsx) with placeholder auth
  (src/lib/pack-auth.ts) and MetaGen receive (src/lib/metagen-receive.ts) behind their own modules, so
  a real backend can replace them without changing screens.
- Journey screens live in src/components/pack/* (ListenerVisit, BusinessJourney, ArtistJourney,
  AdminJourney, ListenerHome) and use `.pk`-scoped styles, which isolate them from the older
  website-style CSS.
- Library views live in a focused LibraryViews screen; curated-list interactions are presentation-only
  wireframe state, while created playlists and follows use the shared Pack store.
- Playback-hour events contain incremental visible simulated player seconds split by Monday-start
  Perth weeks; the admin dashboard shows browser-local totals, not cross-user analytics.
- Action-button sizing uses shared global CSS tokens for legacy `.pk-btn` actions and the
  design-system Button's data attributes, so every journey stays consistent while icon controls remain
  square.

## Backend rules (as the store is replaced)

- The browser never reads the database. Access goes through server functions that check the caller's
  role and scope rows to them.
- Listener endpoints return public fields only: never another user's email or ids.
- Every admin write is audited.
- Schema changes go in a migration under `supabase/migrations/`.
- Run `npm test` and `npx tsc --noEmit` before calling work done.
