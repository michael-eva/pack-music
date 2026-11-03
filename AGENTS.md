# Working on The Pack

- The scope is `Pack MVP Scope from Michael.md`. Requirement IDs (ACC-3, PAY-4, ...) and wireframe IDs
  (A1, B3, ...) in code comments point at it. The current MVP is cut down to a listener app and an admin panel: no payments.
- The browser never reads the database. Every table has RLS on and no policies. All access goes through
  server functions that call `requireRole` from `src/lib/auth.server.ts` and scope rows to the caller.
- Listener endpoints return public fields only: never another user's email or ids.
- Settings that drive playback and the playlist builder live in the `settings` table, not in code.
- Every admin write calls `audit()`.
- After a schema change: add a migration under `supabase/migrations/`, run `npm run db:reset`, then
  `npm run db:types`.
- Run `npm test` and `npx tsc --noEmit` before calling work done.
