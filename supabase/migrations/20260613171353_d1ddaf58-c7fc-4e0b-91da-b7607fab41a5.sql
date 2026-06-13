CREATE OR REPLACE FUNCTION public.is_field_consultant(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('consultor'::public.app_role, 'atendente'::public.app_role)
  )
$$;
REVOKE ALL ON FUNCTION public.is_field_consultant(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_field_consultant(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_field_consultant(uuid) TO authenticated, service_role;