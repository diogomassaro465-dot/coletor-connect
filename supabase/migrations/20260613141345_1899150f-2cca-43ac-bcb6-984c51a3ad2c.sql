ALTER TABLE public.association_assessments
  ALTER COLUMN mandato_em_dia TYPE text USING CASE WHEN mandato_em_dia IS TRUE THEN 'Sim' WHEN mandato_em_dia IS FALSE THEN 'Não' ELSE NULL END,
  ALTER COLUMN ata_registrada_cartorio TYPE text USING CASE WHEN ata_registrada_cartorio IS TRUE THEN 'Sim' WHEN ata_registrada_cartorio IS FALSE THEN 'Não' ELSE NULL END,
  ALTER COLUMN possui_registro_atas TYPE text USING CASE WHEN possui_registro_atas IS TRUE THEN 'Sim' WHEN possui_registro_atas IS FALSE THEN 'Não' ELSE NULL END,
  ADD COLUMN regras_entrada text,
  ADD COLUMN regras_saida_exclusao text,
  ADD COLUMN divisao_tarefas text,
  ADD COLUMN coordenacao_gerencia text,
  ADD COLUMN lista_cooperados_atualizada text,
  ADD COLUMN lista_nao_cooperados_atualizada text,
  ADD COLUMN problemas_juridicos_atuais text,
  ADD COLUMN melhorias_juridicas_necessarias text,
  ADD COLUMN contrato_tipo text,
  ADD COLUMN pendencias_juridicas text,
  ADD COLUMN orientacao_regularizacao_aceita boolean NOT NULL DEFAULT false,
  ADD COLUMN orientacao_documentos_aceita boolean NOT NULL DEFAULT false,
  ADD COLUMN classificacao_juridica text;

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
$function$;