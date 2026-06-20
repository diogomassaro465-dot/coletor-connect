CREATE OR REPLACE FUNCTION public.set_audit_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN
      BEGIN
        NEW.created_by := auth.uid();
      EXCEPTION WHEN OTHERS THEN
        NEW.created_by := NULL;
      END;
    END IF;
    BEGIN
      NEW.updated_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
      NEW.updated_by := NULL;
    END;
  ELSIF TG_OP = 'UPDATE' THEN
    BEGIN
      NEW.updated_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
      NEW.updated_by := NULL;
    END;
  END IF;
  RETURN NEW;
END;
$function$;