# Working on The Pack

- The scope is `Pack MVP Scope from Michael.md`. Requirement IDs (ACC-3, PAY-4, ...) and wireframe IDs
  (A1, B3, ...) in code comments point at it. Parts of it are aspirational: build what the pilot needs.
- The browser never reads the database. Every table has RLS on and no policies. All access goes through
  server functions that call `requireRole` from `src/lib/auth.server.ts` and scope rows to the caller.
- Public listener endpoints return public fields only: never listener identities, emails or legal names.
- Money is integer cents; shares are basis points; the ledger is append-only. Corrections are new entries.
- Settings that drive the ledger, checks and playlists live in the `settings` table, not in code.
- Every admin write calls `audit()`.
- After a schema change: add a migration under `supabase/migrations/`, run `npm run db:reset`, then
  `npm run db:types`.
- Run `npm test` and `npx tsc --noEmit` before calling work done.
