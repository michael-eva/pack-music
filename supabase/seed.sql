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

-- Documents. PLACEHOLDER wording: the real text is Pack legal text (ART-3, VEN-7).
insert into public.documents (kind, version, title, summary, body, href, is_current) values
  ('terms', '0.1-draft', 'Terms of use', '[]',
   'Draft terms. Replace with the approved text before the pilot opens.', null, true),
  ('privacy', '0.1-draft', 'Privacy policy', '[]',
   'Draft privacy policy. We collect the minimum: your email, and anything you choose to add.', null, true),
  ('coop_rules', '2021', 'The Pack Music Co-operative Rules', '[]',
   'The Rules of The Pack Music Co-operative Ltd.', '/docs/pack-coop-rules-2021.pdf', true),
  ('artist_agreement', '0.1-draft', 'Artist Agreement',
   '[{"heading":"Permission to stream","body":"You let The Pack stream your songs to businesses that play local music."},
     {"heading":"Licence-back","body":"The Pack streams under your own APRA AMCOS membership, and pays you directly."},
     {"heading":"How you''re paid","body":"70% of each business fee goes to the artists played there. Statements show the working."},
     {"heading":"Your data stays yours","body":"Export it or withdraw a release whenever you like."}]',
   'Draft agreement. The full legal text goes here once approved.', null, true),
  ('licensing_notice', '0.1-draft', 'Before you switch on The Pack',
   '[{"heading":"What The Pack is","body":"A music service that plays music by local, original artists who have given their permission."},
     {"heading":"What it does not do yet","body":"It does not replace your OneMusic licence."},
     {"heading":"What that means for you","body":"Keep your OneMusic licence until The Pack confirms otherwise in writing. The Pack costs $49.99 per site, per month. Your plan page shows the details."}]',
   'Wording to be reviewed by a person with licensing knowledge before launch (D-25).', null, true);

-- Policy settings (ADM-4). The numbers that drive the ledger live here, not in code.
insert into public.settings (key, value) values
  ('test_mode', 'true'),
  ('site_fee_cents', '4999'),
  ('artist_share_bp', '7000'),
  ('play_threshold_seconds', '30'),
  ('payout_threshold_cents', '1000'),
  ('loudness_target_lufs', '-14'),
  ('accepted_ai_answers', '["no"]'),
  ('playlist_rules', '{"noArtistTwiceInARow": true, "repeatWindowMinutes": 180}'),
  ('feature_flags', '{"businessPlayer": true, "listenerSaves": true, "listenerSuggestions": false}');
