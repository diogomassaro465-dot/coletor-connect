CREATE OR REPLACE FUNCTION public.calculate_diagnostic_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  compliant integer;
  total_items integer := 8;
BEGIN
  IF NEW.evidence_validated IS NOT TRUE THEN
    NEW.regularity_compliant_count := 0;
    NEW.regularity_total_count := total_items;
    NEW.regularity_index := 0;
    NEW.processed_at := NULL;
    NEW.status := 'irregular'::public.diagnostic_status;
    RETURN NEW;
  END IF;

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

UPDATE public.association_assessments SET updated_at = updated_at;