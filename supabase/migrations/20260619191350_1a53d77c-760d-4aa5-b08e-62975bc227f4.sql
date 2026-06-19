
-- 1) Enum de categoria de documento
DO $$ BEGIN
  CREATE TYPE public.association_document_category AS ENUM (
    'estatuto','ata','alvara','licenca_ambiental','balanco','comprovante','outros'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Tabela
CREATE TABLE IF NOT EXISTS public.association_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  category public.association_document_category NOT NULL DEFAULT 'outros',
  title text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  issued_at date,
  expires_at date,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assoc_docs_association ON public.association_documents(association_id);

-- 3) GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_documents TO authenticated;
GRANT ALL ON public.association_documents TO service_role;

-- 4) RLS
ALTER TABLE public.association_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view association documents"
ON public.association_documents FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::public.app_role)
  OR public.is_field_consultant(auth.uid())
);

CREATE POLICY "Staff can insert association documents"
ON public.association_documents FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::public.app_role)
  OR public.is_field_consultant(auth.uid())
);

CREATE POLICY "Staff can update association documents"
ON public.association_documents FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::public.app_role)
  OR public.is_field_consultant(auth.uid())
);

CREATE POLICY "Staff can delete association documents"
ON public.association_documents FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::public.app_role)
  OR public.is_field_consultant(auth.uid())
);

-- 5) Trigger updated_at
DROP TRIGGER IF EXISTS trg_assoc_docs_updated ON public.association_documents;
CREATE TRIGGER trg_assoc_docs_updated
BEFORE UPDATE ON public.association_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) Políticas no bucket privado association-docs (storage.objects)
DROP POLICY IF EXISTS "Staff can view association-docs" ON storage.objects;
CREATE POLICY "Staff can view association-docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'association-docs' AND (
    public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.is_field_consultant(auth.uid())
  )
);

DROP POLICY IF EXISTS "Staff can upload association-docs" ON storage.objects;
CREATE POLICY "Staff can upload association-docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'association-docs' AND (
    public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.is_field_consultant(auth.uid())
  )
);

DROP POLICY IF EXISTS "Staff can update association-docs" ON storage.objects;
CREATE POLICY "Staff can update association-docs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'association-docs' AND (
    public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.is_field_consultant(auth.uid())
  )
);

DROP POLICY IF EXISTS "Staff can delete association-docs" ON storage.objects;
CREATE POLICY "Staff can delete association-docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'association-docs' AND (
    public.has_role(auth.uid(),'admin'::public.app_role)
    OR public.is_field_consultant(auth.uid())
  )
);
