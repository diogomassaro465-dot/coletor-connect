
CREATE POLICY "Admins read catadores docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'catadores-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload catadores docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'catadores-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update catadores docs" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'catadores-docs' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete catadores docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'catadores-docs' AND public.has_role(auth.uid(), 'admin'));
