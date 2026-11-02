GRANT SELECT ON public.signups, public.contact_messages TO authenticated;
CREATE POLICY "Admins read signups" ON public.signups FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins read contact messages" ON public.contact_messages FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));