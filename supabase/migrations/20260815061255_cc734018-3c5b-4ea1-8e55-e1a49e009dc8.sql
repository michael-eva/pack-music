DROP FUNCTION IF EXISTS public.claim_first_admin();

CREATE OR REPLACE FUNCTION public.claim_first_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_first_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_first_admin(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_first_admin(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;