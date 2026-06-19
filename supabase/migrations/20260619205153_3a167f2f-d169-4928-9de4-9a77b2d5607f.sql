DROP POLICY IF EXISTS "Internal users can view associations" ON public.associations;
CREATE POLICY "Internal users can view associations"
  ON public.associations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR is_field_consultant(auth.uid())
    OR is_recenseador(auth.uid())
  );