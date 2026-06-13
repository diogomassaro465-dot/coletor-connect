CREATE OR REPLACE FUNCTION public.is_field_consultant(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('consultor'::public.app_role, 'atendente'::public.app_role)) $$;
REVOKE ALL ON FUNCTION public.is_field_consultant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_field_consultant(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view associations" ON public.associations;
CREATE POLICY "Internal users can view associations" ON public.associations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all catadores" ON public.catadores;
DROP POLICY IF EXISTS "Admins can insert catadores" ON public.catadores;
DROP POLICY IF EXISTS "Admins can update catadores" ON public.catadores;
CREATE POLICY "Internal users can view catadores" ON public.catadores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can insert catadores" ON public.catadores FOR INSERT TO authenticated WITH CHECK (public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can update catadores" ON public.catadores FOR UPDATE TO authenticated USING (public.is_field_consultant(auth.uid())) WITH CHECK (public.is_field_consultant(auth.uid()));

DROP POLICY IF EXISTS "Admins can view assessments" ON public.association_assessments;
DROP POLICY IF EXISTS "Admins can insert assessments" ON public.association_assessments;
DROP POLICY IF EXISTS "Admins can update assessments" ON public.association_assessments;
CREATE POLICY "Internal users can view assessments" ON public.association_assessments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can insert own assessments" ON public.association_assessments FOR INSERT TO authenticated WITH CHECK (public.is_field_consultant(auth.uid()) AND consultant_id = auth.uid());
CREATE POLICY "Consultants can update own assessments" ON public.association_assessments FOR UPDATE TO authenticated USING (public.is_field_consultant(auth.uid()) AND consultant_id = auth.uid()) WITH CHECK (public.is_field_consultant(auth.uid()) AND consultant_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage material prices" ON public.material_prices;
CREATE POLICY "Internal users can view material prices" ON public.material_prices FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can insert material prices" ON public.material_prices FOR INSERT TO authenticated WITH CHECK (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));
CREATE POLICY "Consultants can update material prices" ON public.material_prices FOR UPDATE TO authenticated USING (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid())) WITH CHECK (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage equipment" ON public.association_equipment;
CREATE POLICY "Internal users can view equipment" ON public.association_equipment FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can insert equipment" ON public.association_equipment FOR INSERT TO authenticated WITH CHECK (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));
CREATE POLICY "Consultants can update equipment" ON public.association_equipment FOR UPDATE TO authenticated USING (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid())) WITH CHECK (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage accounting books" ON public.accounting_books;
CREATE POLICY "Internal users can view accounting books" ON public.accounting_books FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can insert accounting books" ON public.accounting_books FOR INSERT TO authenticated WITH CHECK (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));
CREATE POLICY "Consultants can update accounting books" ON public.accounting_books FOR UPDATE TO authenticated USING (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid())) WITH CHECK (public.is_field_consultant(auth.uid()) AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage association evidence" ON public.association_evidence;
CREATE POLICY "Internal users can view association evidence" ON public.association_evidence FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants can insert own evidence" ON public.association_evidence FOR INSERT TO authenticated WITH CHECK (public.is_field_consultant(auth.uid()) AND uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.association_assessments a WHERE a.id = assessment_id AND a.consultant_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read catadores docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload catadores docs" ON storage.objects;
DROP POLICY IF EXISTS "Admins update catadores docs" ON storage.objects;
CREATE POLICY "Internal users read field documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'catadores-docs' AND (public.has_role(auth.uid(), 'admin') OR public.is_field_consultant(auth.uid())));
CREATE POLICY "Consultants upload field documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'catadores-docs' AND public.is_field_consultant(auth.uid()));
CREATE POLICY "Consultants update field documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'catadores-docs' AND public.is_field_consultant(auth.uid())) WITH CHECK (bucket_id = 'catadores-docs' AND public.is_field_consultant(auth.uid()));