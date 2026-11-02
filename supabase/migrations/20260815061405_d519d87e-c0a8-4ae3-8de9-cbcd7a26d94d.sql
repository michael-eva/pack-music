CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$function$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY "Users can see their own roles" ON public.user_roles;
CREATE POLICY "Users can see their own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins write posts" ON public.posts;
DROP POLICY "Admins read all posts" ON public.posts;
CREATE POLICY "Admins write posts" ON public.posts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read all posts" ON public.posts FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins write library items" ON public.library_items;
DROP POLICY "Admins read all library items" ON public.library_items;
CREATE POLICY "Admins write library items" ON public.library_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read all library items" ON public.library_items FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins write board members" ON public.board_members;
DROP POLICY "Admins read all board members" ON public.board_members;
CREATE POLICY "Admins write board members" ON public.board_members FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read all board members" ON public.board_members FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins manage uploads" ON public.uploads;
CREATE POLICY "Admins manage uploads" ON public.uploads FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins read documents" ON storage.objects;
DROP POLICY "Admins upload documents" ON storage.objects;
DROP POLICY "Admins update documents" ON storage.objects;
DROP POLICY "Admins delete documents" ON storage.objects;
CREATE POLICY "Admins read documents" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins upload documents" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update documents" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete documents" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND private.has_role(auth.uid(), 'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);