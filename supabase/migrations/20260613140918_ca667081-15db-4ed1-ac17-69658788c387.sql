ALTER TABLE public.association_assessments
  ALTER COLUMN cooperativa_fornece_epis TYPE text
  USING CASE
    WHEN cooperativa_fornece_epis IS TRUE THEN 'Todos'
    WHEN cooperativa_fornece_epis IS FALSE THEN 'Não'
    ELSE NULL
  END;