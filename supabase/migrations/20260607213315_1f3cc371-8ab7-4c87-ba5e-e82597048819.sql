
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'atendente');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-grant admin role to new signups (MVP)
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Catadores
CREATE TYPE public.catador_status AS ENUM ('pendente', 'ativo', 'inativo');
CREATE TYPE public.catador_genero AS ENUM ('feminino', 'masculino', 'lgbtqia', 'nao_responder');

CREATE TABLE public.catadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  nome_cooperativa TEXT,
  genero public.catador_genero NOT NULL,
  autodeclaracao_racial TEXT NOT NULL,
  escolaridade TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco_completo TEXT NOT NULL,
  comprovante_residencia_url TEXT,
  cpf TEXT NOT NULL UNIQUE,
  cpf_foto_url TEXT,
  rg_cin TEXT NOT NULL,
  rg_cin_foto_url TEXT,
  titulo_eleitor TEXT,
  titulo_eleitor_foto_url TEXT,
  ctps TEXT,
  ctps_foto_url TEXT,
  nis TEXT,
  nis_foto_url TEXT,
  renda_media_mensal NUMERIC(10,2) NOT NULL DEFAULT 0,
  contribui_inss BOOLEAN NOT NULL DEFAULT false,
  inscrito_cadunico BOOLEAN NOT NULL DEFAULT false,
  possui_bolsa_familia BOOLEAN NOT NULL DEFAULT false,
  conta_bancaria_digital TEXT,
  cadastro_gov_br BOOLEAN NOT NULL DEFAULT false,
  nivel_cadastro_gov_br TEXT,
  materiais_coletados TEXT[] NOT NULL DEFAULT '{}',
  possui_carroca BOOLEAN NOT NULL DEFAULT false,
  tipo_carroca TEXT,
  area_atuacao TEXT,
  status public.catador_status NOT NULL DEFAULT 'pendente',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_cadastro TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.catadores TO authenticated;
GRANT ALL ON public.catadores TO service_role;

ALTER TABLE public.catadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all catadores" ON public.catadores
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert catadores" ON public.catadores
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update catadores" ON public.catadores
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete catadores" ON public.catadores
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER catadores_set_updated_at
BEFORE UPDATE ON public.catadores
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_catadores_status ON public.catadores(status);
CREATE INDEX idx_catadores_cpf ON public.catadores(cpf);
CREATE INDEX idx_catadores_data_cadastro ON public.catadores(data_cadastro DESC);
