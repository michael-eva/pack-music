-- Applied to PackDatabase by the payments team before this repo tracked its schema.
-- Its effect is captured in 20261112163309_remote_schema.sql; kept so local and
-- remote migration history match. Original statements:
--
-- alter table public.business_and_site alter column site_id drop default;
-- alter table public.listeners_profile alter column listener_id drop default;
select 1;
