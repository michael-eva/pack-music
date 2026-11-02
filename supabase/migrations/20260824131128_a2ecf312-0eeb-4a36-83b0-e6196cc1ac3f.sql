CREATE TABLE public.site_text (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_text TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_text TO authenticated;
GRANT ALL ON public.site_text TO service_role;

ALTER TABLE public.site_text ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site text" ON public.site_text FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write site text" ON public.site_text FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));