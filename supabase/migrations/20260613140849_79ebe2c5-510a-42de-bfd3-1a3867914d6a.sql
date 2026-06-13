ALTER TABLE public.association_assessments
  ADD COLUMN presidente_nome text,
  ADD COLUMN presidente_telefone text,
  ADD COLUMN vice_presidente_nome text,
  ADD COLUMN vice_presidente_telefone text,
  ADD COLUMN consentimento_dados boolean NOT NULL DEFAULT false,
  ADD COLUMN declaracao_veracidade boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.association_assessments.consentimento_dados IS 'Autorização expressa para tratamento dos dados coletados no diagnóstico';
COMMENT ON COLUMN public.association_assessments.declaracao_veracidade IS 'Declaração de veracidade das informações prestadas';