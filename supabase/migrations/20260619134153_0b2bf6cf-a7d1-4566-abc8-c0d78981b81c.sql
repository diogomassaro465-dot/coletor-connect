
-- =========================================
-- Profiles table
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cpf text UNIQUE,
  birth_date date,
  email text NOT NULL,
  photo_url text,
  municipio_referencia text,
  identificacao_profissional text,
  must_change_password boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- user_roles admin management
-- =========================================
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- =========================================
-- Helper: is_recenseador
-- =========================================
CREATE OR REPLACE FUNCTION public.is_recenseador(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'recenseador'::public.app_role
  )
$$;

-- =========================================
-- Audit metadata columns
-- =========================================
ALTER TABLE public.catadores               ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.associations            ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.associations            ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.association_assessments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.association_assessments ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_fields_catadores ON public.catadores;
CREATE TRIGGER audit_fields_catadores BEFORE INSERT OR UPDATE ON public.catadores
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

DROP TRIGGER IF EXISTS audit_fields_associations ON public.associations;
CREATE TRIGGER audit_fields_associations BEFORE INSERT OR UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

DROP TRIGGER IF EXISTS audit_fields_assessments ON public.association_assessments;
CREATE TRIGGER audit_fields_assessments BEFORE INSERT OR UPDATE ON public.association_assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

-- =========================================
-- Auditoria (log_admin_change)
-- =========================================
DROP TRIGGER IF EXISTS audit_log_catadores ON public.catadores;
CREATE TRIGGER audit_log_catadores AFTER INSERT OR UPDATE OR DELETE ON public.catadores
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();

DROP TRIGGER IF EXISTS audit_log_associations ON public.associations;
CREATE TRIGGER audit_log_associations AFTER INSERT OR UPDATE OR DELETE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();

DROP TRIGGER IF EXISTS audit_log_assessments ON public.association_assessments;
CREATE TRIGGER audit_log_assessments AFTER INSERT OR UPDATE OR DELETE ON public.association_assessments
  FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();

-- =========================================
-- Separação estrita de papéis
-- =========================================
-- Catadores: somente Recenseador edita / insere; Admin + Recenseador veem
DROP POLICY IF EXISTS "Consultants can insert catadores" ON public.catadores;
DROP POLICY IF EXISTS "Consultants can update catadores" ON public.catadores;
DROP POLICY IF EXISTS "Internal users can view catadores" ON public.catadores;

CREATE POLICY "Recenseadores can insert catadores"
  ON public.catadores FOR INSERT
  WITH CHECK (public.is_recenseador(auth.uid()));

CREATE POLICY "Recenseadores can update catadores"
  ON public.catadores FOR UPDATE
  USING (public.is_recenseador(auth.uid()))
  WITH CHECK (public.is_recenseador(auth.uid()));

CREATE POLICY "Admin and recenseadores can view catadores"
  ON public.catadores FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.is_recenseador(auth.uid()));

-- Associations: somente Admin pode editar (consultor continua só visualizando)
DROP POLICY IF EXISTS "Internal users can update associations" ON public.associations;
CREATE POLICY "Admins can update associations"
  ON public.associations FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
