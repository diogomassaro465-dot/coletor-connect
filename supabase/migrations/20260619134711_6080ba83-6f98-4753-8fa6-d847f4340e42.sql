
-- Permitir que recenseadores enviem / atualizem / leiam documentos de catadores
DROP POLICY IF EXISTS "Consultants upload field documents" ON storage.objects;
DROP POLICY IF EXISTS "Consultants update field documents" ON storage.objects;
DROP POLICY IF EXISTS "Internal users read field documents" ON storage.objects;

CREATE POLICY "Field staff upload catadores docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'catadores-docs'
    AND (public.is_field_consultant(auth.uid()) OR public.is_recenseador(auth.uid()))
  );

CREATE POLICY "Field staff update catadores docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'catadores-docs'
    AND (public.is_field_consultant(auth.uid()) OR public.is_recenseador(auth.uid()))
  )
  WITH CHECK (
    bucket_id = 'catadores-docs'
    AND (public.is_field_consultant(auth.uid()) OR public.is_recenseador(auth.uid()))
  );

CREATE POLICY "Internal users read catadores docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'catadores-docs'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.is_field_consultant(auth.uid())
      OR public.is_recenseador(auth.uid())
    )
  );
