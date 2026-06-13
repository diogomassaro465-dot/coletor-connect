CREATE TYPE public.diagnostic_status AS ENUM ('regular', 'parcialmente_regular', 'irregular');
CREATE TYPE public.assessment_module AS ENUM ('social', 'juridico', 'contabil');

CREATE TABLE public.associations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'informal',
  cnpj text UNIQUE,
  municipio text NOT NULL,
  inscricao_municipal text,
  inscricao_estadual text,
  endereco_sede text NOT NULL,
  telefone text,
  email text,
  numero_associados_inicial integer NOT NULL DEFAULT 0,
  numero_associados_atual integer NOT NULL DEFAULT 0,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.associations TO authenticated;
GRANT ALL ON public.associations TO service_role;
ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view associations" ON public.associations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert associations" ON public.associations FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update associations" ON public.associations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete associations" ON public.associations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_associations_updated_at BEFORE UPDATE ON public.associations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.catadores ADD COLUMN association_id uuid REFERENCES public.associations(id) ON DELETE RESTRICT;
CREATE INDEX catadores_association_id_idx ON public.catadores(association_id);

CREATE TABLE public.association_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  consultant_id uuid NOT NULL,
  consultant_name text NOT NULL,
  data_visita date NOT NULL,
  horario_visita time NOT NULL,
  status diagnostic_status NOT NULL DEFAULT 'irregular',
  homens integer NOT NULL DEFAULT 0,
  mulheres integer NOT NULL DEFAULT 0,
  possui_pessoas_trans boolean NOT NULL DEFAULT false,
  pessoas_trans_detalhes text,
  autodeclaracao_racial text,
  faixa_etaria_predominante text,
  escolaridade_predominante text,
  media_moradores_casa integer,
  criancas_adolescentes_dependentes boolean,
  contribuicao_inss text,
  inscritos_cadunico text,
  uso_epis text,
  cooperativa_fornece_epis boolean,
  acidentes_ultimo_ano boolean,
  acidentes_tipo text,
  problemas_saude text,
  media_horas_trabalhadas text,
  aumento_trabalho_festividades boolean,
  necessita_documentos boolean,
  documentos_necessarios text,
  recebe_beneficios boolean,
  quantidade_beneficiarios integer,
  reconhecimento_sociedade text,
  relatos_preconceito boolean,
  preconceito_detalhes text,
  motivos_entrada_reciclagem text,
  historico_trabalho_infantil boolean,
  quantidade_trabalho_infantil integer,
  interesse_capacitacao boolean,
  capacitacoes_interesse text,
  tipo_coleta text,
  materiais_coletados text[] NOT NULL DEFAULT '{}',
  realiza_triagem boolean,
  volumetria_toneladas_mes numeric(12,3),
  renda_media_mensal numeric(12,2),
  possui_parcerias text,
  parcerias_detalhes text,
  destino_venda text,
  tipo_galpao text,
  possui_veiculos_maquinas boolean,
  recebeu_apoio_programas boolean,
  participa_movimentos boolean,
  movimento_qual text,
  diretoria_conselho boolean,
  diretoria_nomes text,
  mandato_em_dia boolean,
  conselho_fiscal text,
  cargos_por_eleicao text,
  data_ultima_eleicao date,
  ata_registrada_cartorio boolean,
  realiza_assembleias text,
  frequencia_assembleias text,
  possui_registro_atas boolean,
  assessoria_juridica boolean,
  apoio_instituicoes boolean,
  apoio_instituicoes_quais text,
  processos_judiciais boolean,
  processos_judiciais_quais text,
  todos_sao_cooperados boolean,
  regras_entrada_exclusao boolean,
  fluxo_trabalho_diario text,
  divisao_tarefas_gerencia boolean,
  controle_jornada boolean,
  problemas_melhorias_juridico text,
  contrato_remunerado boolean,
  contrato_detalhes text,
  participa_coleta_seletiva_municipal boolean,
  apoio_poder_publico text,
  estatuto_registrado boolean,
  alvara_funcionamento boolean,
  licenca_ambiental_status text,
  avcb text,
  extintores text,
  registro_ocb text,
  empregados_registrados integer NOT NULL DEFAULT 0,
  empregados_sem_registro integer NOT NULL DEFAULT 0,
  autonomos integer NOT NULL DEFAULT 0,
  livro_ficha_trabalho boolean,
  livro_ficha_trabalho_qual text,
  livro_inspecao_trabalho boolean,
  filiacao_sindical boolean,
  filiacao_sindical_qual text,
  contrato_sst text,
  contrato_sst_responsavel text,
  controle_frequencia text,
  controle_frequencia_tipo text,
  possui_contador text,
  contador_tipo text,
  contador_nome text,
  contador_telefone text,
  contador_email text,
  contabilidade_regular text,
  possui_conta_bancaria text,
  possui_maquineta text,
  emite_notas_fiscais text,
  controle_estoque text,
  sistema_financeiro text,
  sistema_financeiro_qual text,
  ano_ultimo_balanco integer,
  metodo_divisao_dinheiro text,
  metodo_divisao_descricao text,
  pagamento_fixo_mensal boolean,
  renda_media_cooperado numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_assessments TO authenticated;
GRANT ALL ON public.association_assessments TO service_role;
ALTER TABLE public.association_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view assessments" ON public.association_assessments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert assessments" ON public.association_assessments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND consultant_id = auth.uid());
CREATE POLICY "Admins can update assessments" ON public.association_assessments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete assessments" ON public.association_assessments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX association_assessments_association_idx ON public.association_assessments(association_id);
CREATE INDEX association_assessments_visit_idx ON public.association_assessments(data_visita DESC);
CREATE TRIGGER set_association_assessments_updated_at BEFORE UPDATE ON public.association_assessments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.material_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.association_assessments(id) ON DELETE CASCADE,
  material text NOT NULL,
  comprador text,
  preco_por_kg numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.material_prices TO authenticated;
GRANT ALL ON public.material_prices TO service_role;
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage material prices" ON public.material_prices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.association_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.association_assessments(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  quantidade integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_equipment TO authenticated;
GRANT ALL ON public.association_equipment TO service_role;
ALTER TABLE public.association_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage equipment" ON public.association_equipment FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.accounting_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.association_assessments(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  implantado boolean NOT NULL DEFAULT false,
  atualizado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_books TO authenticated;
GRANT ALL ON public.accounting_books TO service_role;
ALTER TABLE public.accounting_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage accounting books" ON public.accounting_books FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.association_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES public.association_assessments(id) ON DELETE CASCADE,
  module assessment_module NOT NULL,
  category text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_evidence TO authenticated;
GRANT ALL ON public.association_evidence TO service_role;
ALTER TABLE public.association_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage association evidence" ON public.association_evidence FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') AND uploaded_by = auth.uid());
CREATE INDEX association_evidence_association_idx ON public.association_evidence(association_id);

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_admin_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE((to_jsonb(NEW)->>'id'), (to_jsonb(OLD)->>'id')),
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_associations AFTER INSERT OR UPDATE OR DELETE ON public.associations FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
CREATE TRIGGER audit_assessments AFTER INSERT OR UPDATE OR DELETE ON public.association_assessments FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
CREATE TRIGGER audit_material_prices AFTER INSERT OR UPDATE OR DELETE ON public.material_prices FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
CREATE TRIGGER audit_equipment AFTER INSERT OR UPDATE OR DELETE ON public.association_equipment FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
CREATE TRIGGER audit_accounting_books AFTER INSERT OR UPDATE OR DELETE ON public.accounting_books FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
CREATE TRIGGER audit_evidence AFTER INSERT OR UPDATE OR DELETE ON public.association_evidence FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();
CREATE TRIGGER audit_catadores AFTER INSERT OR UPDATE OR DELETE ON public.catadores FOR EACH ROW EXECUTE FUNCTION public.log_admin_change();

CREATE OR REPLACE FUNCTION public.calculate_diagnostic_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  compliant integer;
  total_items integer := 8;
BEGIN
  compliant :=
    (CASE WHEN NEW.mandato_em_dia IS TRUE THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.ata_registrada_cartorio IS TRUE THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.estatuto_registrado IS TRUE THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.alvara_funcionamento IS TRUE THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.licenca_ambiental_status IN ('Licença', 'Dispensa') THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.contabilidade_regular = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.emite_notas_fiscais = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.controle_estoque = 'Sim' THEN 1 ELSE 0 END);
  NEW.status := CASE
    WHEN compliant = total_items THEN 'regular'::public.diagnostic_status
    WHEN compliant >= 4 THEN 'parcialmente_regular'::public.diagnostic_status
    ELSE 'irregular'::public.diagnostic_status
  END;
  RETURN NEW;
END;
$$;
CREATE TRIGGER calculate_assessment_status BEFORE INSERT OR UPDATE ON public.association_assessments FOR EACH ROW EXECUTE FUNCTION public.calculate_diagnostic_status();