-- The Pack, schema v1 (MVP: listener app and admin panel).
--
-- Scope for this MVP: admins upload music and build playlists; listeners sign
-- in, browse and play. No payments, ledger, businesses or artist accounts yet.
--
-- Access model: every table has row-level security switched on and NO policies,
-- and nothing is granted to anon or authenticated. The browser never reads the
-- database directly. All reads and writes go through server functions, which
-- check the caller's roles first (src/lib/auth.server.ts).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Accounts, roles, invites, documents
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('admin', 'curator', 'listener');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  news_opt_in boolean not null default false,
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Single-use links for admin and curator accounts. Listeners sign up openly.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  email text not null,
  role public.app_role not null,
  created_by uuid references auth.users (id),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz,
  used_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create type public.document_kind as enum ('terms', 'privacy');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  kind public.document_kind not null,
  version text not null,
  title text not null,
  body text not null default '',
  href text,
  is_current boolean not null default false,
  published_at timestamptz not null default now(),
  unique (kind, version)
);
create unique index documents_one_current on public.documents (kind) where is_current;

create table public.acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.documents (id),
  accepted_at timestamptz not null default now(),
  unique (user_id, document_id)
);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.regions (
  code text primary key,
  name text not null,
  sort_order int not null default 0
);

create table public.genres (
  id text primary key,
  label text not null,
  parent_id text references public.genres (id),
  retired_at timestamptz
);

create table public.descriptors (
  id text primary key,
  facet text not null, -- setting | energy | time | vocals | tempo
  label text not null,
  retired_at timestamptz
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text references public.regions (code),
  bio text not null default '',
  links text not null default '',
  photo_url text,
  creator_id_url text, -- Verified Human Creator ID link, when MetaGen supplies one
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.release_type as enum ('single', 'ep', 'album');
create type public.release_state as enum ('draft', 'live', 'withdrawn');

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete restrict,
  title text not null,
  type public.release_type not null default 'single',
  upc text unique,
  label text,
  p_line text,
  original_release_date date,
  artwork_url text,
  state public.release_state not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  position int not null,
  title text not null,
  isrc text unique,
  duration_ms int not null default 0,
  audio_path text, -- object in the private "audio" bucket
  explicit boolean not null default false,
  genre_id text references public.genres (id),
  ai_declaration text, -- 'no' | 'yes' | null (not recorded)
  lufs numeric(5, 2),
  true_peak numeric(5, 2),
  lra numeric(5, 2),
  story text not null default '',
  taken_down_at timestamptz,
  created_at timestamptz not null default now(),
  unique (release_id, position)
);

create table public.track_descriptors (
  track_id uuid not null references public.tracks (id) on delete cascade,
  descriptor_id text not null references public.descriptors (id),
  primary key (track_id, descriptor_id)
);

-- ---------------------------------------------------------------------------
-- Curation and playlists. A published version is never edited (CUR-3).
-- ---------------------------------------------------------------------------

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  cover_url text,
  curator_user_id uuid references auth.users (id),
  curated_by text not null, -- "Alex & The Pack"
  is_featured boolean not null default false, -- shown on the listener home
  featured_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.playlist_versions (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  version int not null,
  published_at timestamptz,
  published_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (playlist_id, version)
);

create table public.playlist_tracks (
  playlist_version_id uuid not null references public.playlist_versions (id) on delete cascade,
  position int not null,
  track_id uuid not null references public.tracks (id),
  primary key (playlist_version_id, position)
);

-- ---------------------------------------------------------------------------
-- Listener library
-- ---------------------------------------------------------------------------

create table public.saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  saved_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- ---------------------------------------------------------------------------
-- Settings and audit
-- ---------------------------------------------------------------------------

create table public.settings (
  key text primary key,
  value jsonb not null,
  changed_by uuid references auth.users (id),
  changed_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id),
  action text not null,
  target text,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lock everything down. Server functions use the service role.
-- ---------------------------------------------------------------------------

do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on public.%I from anon, authenticated', t.tablename);
    execute format('grant all on public.%I to service_role', t.tablename);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;

-- Storage: audio private (signed links only), artwork public.
insert into storage.buckets (id, name, public) values
  ('audio', 'audio', false),
  ('artwork', 'artwork', true)
on conflict (id) do nothing;
