CREATE TYPE public.signup_role AS ENUM ('artist','listener','business','council');

CREATE TABLE public.signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  role public.signup_role NOT NULL DEFAULT 'listener',
  location text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX signups_email_unique ON public.signups (lower(email));

GRANT ALL ON public.signups TO service_role;

ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;