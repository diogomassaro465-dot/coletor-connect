ALTER TABLE public.association_assessments
  ADD COLUMN regularity_compliant_count integer NOT NULL DEFAULT 0,
  ADD COLUMN regularity_total_count integer NOT NULL DEFAULT 8,
  ADD COLUMN regularity_index numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN processed_at timestamptz,
  ADD COLUMN evidence_validated boolean NOT NULL DEFAULT false,
  ADD COLUMN representative_name text,
  ADD COLUMN representative_signature text,
  ADD COLUMN signed_at timestamptz;

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
    (CASE WHEN NEW.mandato_em_dia = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.ata_registrada_cartorio = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.estatuto_registrado = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.alvara_funcionamento = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.licenca_ambiental_status IN ('Licença', 'Dispensa') THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.contabilidade_regular = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.emite_notas_fiscais = 'Sim' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.controle_estoque = 'Sim' THEN 1 ELSE 0 END);

  NEW.regularity_compliant_count := compliant;
  NEW.regularity_total_count := total_items;
  NEW.regularity_index := round((compliant::numeric / total_items::numeric) * 100, 2);
  NEW.processed_at := now();
  NEW.status := CASE
    WHEN compliant = total_items THEN 'regular'::public.diagnostic_status
    WHEN compliant >= 4 THEN 'parcialmente_regular'::public.diagnostic_status
    ELSE 'irregular'::public.diagnostic_status
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_assessment_status ON public.association_assessments;
CREATE TRIGGER calculate_assessment_status
BEFORE INSERT OR UPDATE ON public.association_assessments
FOR EACH ROW EXECUTE FUNCTION public.calculate_diagnostic_status();

UPDATE public.association_assessments SET updated_at = updated_at;

COMMENT ON COLUMN public.association_assessments.regularity_index IS 'Percentual de critérios de regularidade atendidos entre os oito critérios vigentes';
COMMENT ON COLUMN public.association_assessments.evidence_validated IS 'Confirma que evidências obrigatórias e assinatura foram verificadas antes da conclusão';
COMMENT ON COLUMN public.association_assessments.representative_signature IS 'Assinatura manuscrita capturada como imagem em formato data URL';