DROP POLICY IF EXISTS "Admins can update associations" ON public.associations;
CREATE POLICY "Internal users can update associations"
ON public.associations FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));