ALTER TABLE public.association_assessments
  ALTER COLUMN estatuto_registrado TYPE text USING CASE WHEN estatuto_registrado IS TRUE THEN 'Sim' WHEN estatuto_registrado IS FALSE THEN 'Não' ELSE NULL END,
  ALTER COLUMN alvara_funcionamento TYPE text USING CASE WHEN alvara_funcionamento IS TRUE THEN 'Sim' WHEN alvara_funcionamento IS FALSE THEN 'Não' ELSE NULL END,
  ADD COLUMN divisao_resultados_criterio text,
  ADD COLUMN divisao_resultados_procedimento text,
  ADD COLUMN pendencias_contabeis text,
  ADD COLUMN classificacao_contabil text,
  ADD COLUMN evidencia_frente_confirmada boolean NOT NULL DEFAULT false,
  ADD COLUMN evidencia_administrativo_confirmada boolean NOT NULL DEFAULT false,
  ADD COLUMN evidencia_reuniao_confirmada boolean NOT NULL DEFAULT false,
  ADD COLUMN evidencia_livro_trabalho_confirmada boolean NOT NULL DEFAULT false;

ALTER TABLE public.accounting_books
  ADD COLUMN nao_sabe boolean NOT NULL DEFAULT false,
  ADD COLUMN nao_possui boolean NOT NULL DEFAULT false,
  ADD COLUMN observacao text;

CREATE OR REPLACE FUNCTION public.calculate_diagnostic_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
  NEW.status := CASE
    WHEN compliant = total_items THEN 'regular'::public.diagnostic_status
    WHEN compliant >= 4 THEN 'parcialmente_regular'::public.diagnostic_status
    ELSE 'irregular'::public.diagnostic_status
  END;
  RETURN NEW;
END;
$function$;