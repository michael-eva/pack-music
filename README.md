# The Pack

The Pack's streaming app for the Living Labs pilot: local music played in real businesses, with a
ledger that pays the artists played at each site. Built from *Pack MVP Scope from Michael.md*.

## What's in it

| Area | Who | Path |
| --- | --- | --- |
| Now playing, artist and business pages, saved songs | Listener (no login to look) | `/c/:code`, `/a/:artistId`, `/place/:code`, `/saved` |
| Site, player, playlists, plan | Business owner and staff | `/business` |
| Releases, who gets paid, earnings, my data | Artist | `/studio` |
| Review, playlists, sites, users, ledger, policy, audit | Admin and curator | `/admin` |

The pilot is ledger-only: the payments engine runs the real rules on notional money and no money moves.

## Run it locally

You need Node 22+ (Node 25 runs the TypeScript scripts directly), [Bun](https://bun.sh) or npm,
Docker Desktop, the [Supabase CLI](https://supabase.com/docs/guides/cli) and ffmpeg (`brew install ffmpeg`).

```sh
bun install                 # or npm install
supabase start              # local Postgres, Auth, Storage and mailbox (Docker)
cp .env.example .env        # then paste the keys from: supabase status -o env
npm run db:reset            # schema + reference data + demo accounts, music and plays
npm run dev                 # http://localhost:3000
```

Demo accounts all use the password `packpack`:

| Account | Role |
| --- | --- |
| admin@pack.test | Admin and curator |
| curator@pack.test | Curator |
| sam@pack.test | Artist, The Southerlies |
| cafe@pack.test | Business owner, Example Café (`/c/exa`) |
| jess@pack.test | Staff at Example Café |
| books@pack.test | Owner of Corner Books and Harbour Salon |
| listener@pack.test | Listener |

Sign-in links and other auth emails go to the local mailbox at http://127.0.0.1:54324.
Supabase Studio is at http://127.0.0.1:54323.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | App on port 3000 |
| `npm test` | Unit tests (payments engine, loudness, checks, playlist rules) |
| `npm run db:reset` | Rebuild the local database and reload the demo |
| `npm run db:types` | Regenerate `src/integrations/supabase/types.ts` after a migration |
| `npm run build && npm start` | Production build on Node |

## How it fits together

- **Stack**: TanStack Start (React 19, SSR, server functions), Tailwind 4, Supabase (Postgres, Auth, Storage).
- **Access**: the browser never queries the database. Every table has row-level security on with no
  policies; server functions check the caller's roles (`src/lib/auth.server.ts`) and then use the service role.
- **Schema**: `supabase/migrations/`. Money is integer cents, shares are basis points, the ledger is
  append-only (a trigger refuses updates and deletes).
- **Payments engine**: `src/lib/ledger/engine.ts`, pure and tested against the worked example in section 8.
- **Loudness**: masters are never altered; the player applies `target − measured` gain, capped by
  true-peak headroom (`src/lib/loudness.ts`).
- **Brand**: colours, type and the torn-paper look come from The Pack Style Guide V3 (`src/styles.css`).

## Not built yet

MetaGen package ingestion (no sample package yet, so artists enter releases through a form that
captures the same fields), real email sending for invites, real payouts (Phase 2), and everything the
scope places after the pilot.
