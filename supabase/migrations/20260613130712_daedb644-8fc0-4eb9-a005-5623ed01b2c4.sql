REVOKE ALL ON FUNCTION public.log_admin_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_change() TO service_role;