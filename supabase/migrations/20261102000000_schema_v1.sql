-- The Pack, schema v1 (Living Labs pilot).
-- Source: "Pack MVP Scope", section 7 (data model) and section 8 (payments engine).
--
-- Access model: every table has row-level security switched on and NO policies,
-- and nothing is granted to anon or authenticated. The browser never reads the
-- database directly. All reads and writes go through server functions, which
-- check the caller's roles first (src/lib/auth.server.ts).
--
-- Rules that apply everywhere:
--   * money is whole cents (bigint), never decimal
--   * shares are basis points (10000 = 100%)
--   * nothing that affects money is edited or deleted; corrections are new rows

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Accounts, roles, invites, documents, membership (ACC, ART-3, ADM-3)
-- ---------------------------------------------------------------------------

create type public.app_role as enum
  ('admin', 'curator', 'artist', 'business_owner', 'business_staff', 'listener');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  postcode text,
  news_opt_in boolean not null default false,
  open_data_consent_at timestamptz,
  deactivated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create type public.document_kind as enum
  ('terms', 'privacy', 'coop_rules', 'artist_agreement', 'licensing_notice');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  kind public.document_kind not null,
  version text not null,
  title text not null,
  summary jsonb not null default '[]'::jsonb, -- [{heading, body}] plain-English summary
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

create type public.membership_class as enum ('full', 'associate');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  class public.membership_class not null,
  rules_document_id uuid not null references public.documents (id),
  accepted_at timestamptz not null default now()
);

create table public.regions (
  code text primary key,
  name text not null,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Artists, people, businesses, sites
-- ---------------------------------------------------------------------------

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  public_name text not null,
  legal_name text not null default '',
  region text references public.regions (code),
  bio text not null default '',
  links text not null default '',
  photo_url text,
  cohort text,
  creator_id_url text,
  payout_account text, -- PAY-11: empty until Stripe Connect in Phase 2
  created_at timestamptz not null default now()
);

-- A person who can be paid (CAT-7, PAY-8). May have no account yet.
create table public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  ipi text unique,
  isni text unique,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  address text not null default '',
  region text references public.regions (code),
  business_type text not null default 'Café',
  opening_hours text not null default '',
  player_start time not null default '07:00',
  player_end time not null default '09:00',
  vibe text not null default '',
  fee_cents bigint not null default 4999,
  short_code text not null unique,
  trim_db numeric(4, 1) not null default 0 check (trim_db between -6 and 6),
  explicit_allowed boolean not null default false,
  use_house_playlist boolean not null default false,
  licensing_accepted_at timestamptz,
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.site_staff (
  site_id uuid not null references public.sites (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(18), 'hex'),
  email text not null,
  role public.app_role not null,
  cohort text,
  business_id uuid references public.businesses (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  created_by uuid references auth.users (id),
  expires_at timestamptz not null default now() + interval '14 days',
  used_at timestamptz,
  used_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Taxonomy (TAX)
-- ---------------------------------------------------------------------------

create table public.genres (
  id text primary key,
  label text not null,
  parent_id text references public.genres (id),
  list_version int not null default 1,
  retired_at timestamptz
);

create table public.descriptors (
  id text primary key,
  facet text not null, -- setting | energy | time | vocals | tempo
  label text not null,
  retired_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Catalogue (CAT, ING, RTS)
-- ---------------------------------------------------------------------------

create type public.release_type as enum ('single', 'ep', 'album');
create type public.release_state as enum
  ('draft', 'received', 'checking', 'needs_attention', 'held', 'rejected', 'in_review',
   'approved', 'scheduled', 'live', 'withdrawn', 'taken_down');
create type public.rights_status as enum
  ('unsigned', 'independent_label', 'distributor', 'major_label', 'unknown');

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete restrict,
  title text not null,
  type public.release_type not null default 'single',
  upc text unique,
  label text,
  p_line text,
  original_release_date date,
  pack_release_date date,
  artwork_url text,
  rights_status public.rights_status,
  rights_confirmed_at timestamptz,
  splits_confirmed_at timestamptz,
  state public.release_state not null default 'draft',
  version int not null default 1,
  submitted_at timestamptz,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  review_note text,
  genre_list_version int not null default 1,
  created_at timestamptz not null default now()
);

-- Every lifecycle change, with actor and reason (CAT-4).
create table public.release_events (
  id bigint generated always as identity primary key,
  release_id uuid not null references public.releases (id) on delete cascade,
  from_state public.release_state,
  to_state public.release_state not null,
  actor uuid references auth.users (id),
  reason text,
  created_at timestamptz not null default now()
);

-- Check results shown to the artist and reviewer (ING-4 to ING-6).
create table public.release_issues (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  track_id uuid,
  code text not null,
  outcome text not null check (outcome in ('reject', 'hold', 'warn')),
  message text not null,
  fixed_by text not null,
  cleared_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  position int not null,
  title text not null,
  version_title text,
  isrc text unique,
  iswc text,
  duration_ms int not null default 0,
  audio_path text, -- object in the private "audio" bucket
  language text not null default 'en',
  explicit boolean not null default false,
  genre_id text references public.genres (id),
  ai_declaration text, -- 'no' | 'yes' | null (unanswered)
  ai_declared_at timestamptz,
  lufs numeric(5, 2),
  true_peak numeric(5, 2),
  lra numeric(5, 2),
  story text not null default '',
  flagged_at timestamptz, -- RTS-6 disputed declaration
  flag_reason text,
  taken_down_at timestamptz, -- RTS-4
  created_at timestamptz not null default now(),
  unique (release_id, position)
);

create table public.track_descriptors (
  track_id uuid not null references public.tracks (id) on delete cascade,
  descriptor_id text not null references public.descriptors (id),
  primary key (track_id, descriptor_id)
);

-- Who gets paid for a track (ART-5). A change is a new split_set, never an edit.
create table public.split_sets (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  confirmed_at timestamptz,
  confirmed_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.splits (
  split_set_id uuid not null references public.split_sets (id) on delete cascade,
  person_id uuid not null references public.people (id),
  role text not null,
  share_bp int not null check (share_bp > 0 and share_bp <= 10000),
  primary key (split_set_id, person_id)
);

-- ---------------------------------------------------------------------------
-- Curation and playlists (CUR)
-- ---------------------------------------------------------------------------

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  curator_user_id uuid references auth.users (id),
  curated_by text not null, -- "Alex & The Pack" or "Priya for Example Café"
  site_id uuid references public.sites (id) on delete cascade, -- set for a business's house picks
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

-- A change of playlist is a new assignment from a start time (CUR-3).
create table public.site_assignments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  playlist_version_id uuid not null references public.playlist_versions (id),
  starts_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id)
);
create index site_assignments_current on public.site_assignments (site_id, starts_at desc);

-- ---------------------------------------------------------------------------
-- Playback (PLY, VEN, LIS)
-- ---------------------------------------------------------------------------

-- The player generates the id, so a retried send records one play (PAY-1).
create table public.play_events (
  id uuid primary key,
  site_id uuid not null references public.sites (id),
  track_id uuid not null references public.tracks (id),
  playlist_version_id uuid references public.playlist_versions (id),
  started_at timestamptz not null,
  seconds_played int not null check (seconds_played >= 0),
  received_at timestamptz not null default now()
);
create index play_events_site_month on public.play_events (site_id, started_at);

create table public.now_playing (
  site_id uuid primary key references public.sites (id) on delete cascade,
  track_id uuid references public.tracks (id),
  playlist_version_id uuid references public.playlist_versions (id),
  started_at timestamptz not null default now()
);

create table public.skips (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
  track_id uuid not null references public.tracks (id),
  reason text not null,
  user_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id),
  site_id uuid references public.sites (id) on delete set null,
  saved_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  track_id uuid not null references public.tracks (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  why text not null default '',
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Payments engine, ledger only in the pilot (PAY)
-- ---------------------------------------------------------------------------

create type public.run_state as enum ('dry_run', 'approved');

create table public.month_runs (
  id uuid primary key default gen_random_uuid(),
  month date not null, -- first day of the month
  state public.run_state not null default 'dry_run',
  settings_snapshot jsonb not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  approved_by uuid references auth.users (id),
  approved_at timestamptz
);
create unique index month_runs_one_approved on public.month_runs (month) where state = 'approved';

create table public.site_pots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.month_runs (id) on delete cascade,
  site_id uuid not null references public.sites (id),
  fee_cents bigint not null,
  artist_pool_cents bigint not null,
  pack_cents bigint not null,
  qualified_plays int not null,
  unique (run_id, site_id)
);

create type public.ledger_type as enum ('accrual', 'adjustment', 'hold', 'release', 'payout');

-- Append-only. A correction is a new row that points at the one it reverses.
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.month_runs (id),
  type public.ledger_type not null,
  person_id uuid not null references public.people (id),
  track_id uuid references public.tracks (id),
  site_id uuid references public.sites (id),
  month date not null,
  cents bigint not null,
  plays int not null default 0,
  pot_plays int not null default 0,
  share_bp int,
  reverses uuid references public.ledger_entries (id),
  created_at timestamptz not null default now()
);
create index ledger_entries_person_month on public.ledger_entries (person_id, month);

create or replace function public.ledger_is_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'ledger_entries is append-only: post a reversing entry instead';
end;
$$;
create trigger ledger_no_update before update or delete on public.ledger_entries
  for each row execute function public.ledger_is_append_only();

-- ---------------------------------------------------------------------------
-- Settings and audit (ADM-4, ACC-5, ADM-7)
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

-- ---------------------------------------------------------------------------
-- Storage: masters and renditions private, artwork public.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values
  ('audio', 'audio', false),
  ('artwork', 'artwork', true)
on conflict (id) do nothing;
