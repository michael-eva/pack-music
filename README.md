# The Pack

The Pack's listening app: music by local, original artists, in playlists curated by people.
Admins upload the music and build the playlists; listeners sign in and play.
Scope source: *Pack MVP Scope from Michael.md* (cut down: no payments in this MVP).

## What's in it

| Area | Who | Path |
| --- | --- | --- |
| Home, playlists, releases, artists, search, saved songs, player | Listener | `/listen` |
| Music upload, playlists, users, settings, audit log | Admin (curators: playlists and tagging) | `/admin` |

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
| listener@pack.test | Listener |

Anyone can create a listener account from the sign-in page. Admin and curator accounts come from an invite link.

Sign-in links and other auth emails go to the local mailbox at http://127.0.0.1:54324.
Supabase Studio is at http://127.0.0.1:54323.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | App on port 3000 |
| `npm test` | Unit tests (loudness, playlist rules, player queue) |
| `npm run db:reset` | Rebuild the local database and reload the demo |
| `npm run db:types` | Regenerate `src/integrations/supabase/types.ts` after a migration |
| `npm run build && npm start` | Production build on Node |

## How it fits together

- **Stack**: TanStack Start (React 19, SSR, server functions), Tailwind 4, Supabase (Postgres, Auth, Storage).
- **Access**: the browser never queries the database. Every table has row-level security on with no
  policies; server functions check the caller's roles (`src/lib/auth.server.ts`) and then use the service role.
- **Schema**: `supabase/migrations/`. Audio is private and played through short-lived signed links.
- **Loudness**: masters are never altered; the player applies `target − measured` gain, capped by
  true-peak headroom (`src/lib/loudness.ts`).
- **Brand**: colours, type and the torn-paper look come from The Pack Style Guide V3 (`src/styles.css`).

## Not built yet

Payments and the ledger, businesses and the in-venue player, artist accounts, MetaGen package
ingestion, and email sending for invites. An earlier version of the payments engine and business
player is in git history (commit 80179c2) if those come back.
