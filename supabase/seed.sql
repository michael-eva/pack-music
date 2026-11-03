-- Reference data loaded by `supabase db reset`.
-- Demo users, music and plays are added afterwards by scripts/seed-demo.ts.

-- Regions. PLACEHOLDER: the scope names "the 12 WA regions used in the data
-- collection spec" but does not list them. Living Labs areas are included.
insert into public.regions (code, name, sort_order) values
  ('perth', 'Perth', 1),
  ('fremantle', 'Fremantle', 2),
  ('vincent', 'Vincent', 3),
  ('subiaco', 'Subiaco', 4),
  ('peel', 'Peel', 5),
  ('bunbury', 'Bunbury', 6),
  ('busselton', 'Busselton', 7),
  ('margaret-river', 'Margaret River', 8),
  ('great-southern', 'Great Southern', 9),
  ('wheatbelt', 'Wheatbelt', 10),
  ('goldfields-esperance', 'Goldfields-Esperance', 11),
  ('mid-west-north', 'Mid West and North', 12);

-- Genre list v1. PLACEHOLDER pending decision D-06: parent genres and a short
-- set of sub-genres, one parent each.
insert into public.genres (id, label, parent_id) values
  ('rock', 'Rock', null), ('pop', 'Pop', null), ('folk', 'Folk', null),
  ('electronic', 'Electronic', null), ('hip-hop', 'Hip hop', null), ('rnb', 'R&B and soul', null),
  ('jazz', 'Jazz', null), ('blues', 'Blues', null), ('country', 'Country', null),
  ('classical', 'Classical', null), ('world', 'World', null), ('reggae', 'Reggae', null),
  ('metal', 'Metal', null), ('punk', 'Punk', null), ('easy', 'Easy listening', null);
insert into public.genres (id, label, parent_id) values
  ('rock-indie', 'Indie', 'rock'), ('rock-surf', 'Surf rock', 'rock'),
  ('pop-indie', 'Indie pop', 'pop'), ('pop-dream', 'Dream pop', 'pop'),
  ('folk-acoustic', 'Acoustic', 'folk'), ('folk-alt', 'Alt folk', 'folk'),
  ('electronic-ambient', 'Ambient', 'electronic'), ('electronic-house', 'House', 'electronic'),
  ('jazz-vocal', 'Vocal jazz', 'jazz'), ('country-australian', 'Australian country', 'country');

-- Business-fit layer (TAX-2). Values proposed in section 4; curators refine.
insert into public.descriptors (id, facet, label) values
  ('setting-cafe', 'setting', 'Café'), ('setting-bar', 'setting', 'Bar'),
  ('setting-restaurant', 'setting', 'Restaurant'), ('setting-retail', 'setting', 'Retail'),
  ('setting-salon', 'setting', 'Salon'), ('setting-gym', 'setting', 'Gym'),
  ('energy-low', 'energy', 'Low energy'), ('energy-medium', 'energy', 'Medium energy'),
  ('energy-high', 'energy', 'High energy'),
  ('time-morning', 'time', 'Morning'), ('time-afternoon', 'time', 'Afternoon'),
  ('time-evening', 'time', 'Evening'), ('time-late', 'time', 'Late'),
  ('vocals-instrumental', 'vocals', 'Instrumental'), ('vocals-sparse', 'vocals', 'Sparse vocals'),
  ('vocals-led', 'vocals', 'Vocal-led'),
  ('tempo-slow', 'tempo', 'Slow'), ('tempo-mid', 'tempo', 'Mid tempo'), ('tempo-fast', 'tempo', 'Fast');

-- Documents. PLACEHOLDER wording until The Pack approves the real text.
insert into public.documents (kind, version, title, body, is_current) values
  ('terms', '0.1-draft', 'Terms of use',
   'Draft terms. Replace with the approved text before the pilot opens.', true),
  ('privacy', '0.1-draft', 'Privacy policy',
   'Draft privacy policy. We collect the minimum: your email, and anything you choose to add.', true);

-- Settings that drive playback and the playlist builder.
insert into public.settings (key, value) values
  ('loudness_target_lufs', '-14'),
  ('playlist_rules', '{"noArtistTwiceInARow": true, "repeatWindowMinutes": 180}');
