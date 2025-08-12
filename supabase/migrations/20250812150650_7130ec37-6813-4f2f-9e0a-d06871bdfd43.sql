
CREATE OR REPLACE FUNCTION public.log_audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_email_val TEXT;
  details_val JSONB;
  v_entity_id uuid;
BEGIN
  -- Pega o email do JWT ou usa fallback para operações de sistema
  user_email_val := COALESCE(auth.jwt()->>'email', 'system_admin@sql_editor');

  -- Monta o payload conforme a operação
  IF (TG_OP = 'UPDATE') THEN
    details_val := jsonb_build_object('old_data', to_jsonb(OLD), 'new_data', to_jsonb(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    details_val := jsonb_build_object('old_data', to_jsonb(OLD));
  ELSE
    -- INSERT
    details_val := jsonb_build_object('new_data', to_jsonb(NEW));
  END IF;

  -- Garante entity_id mesmo em DELETE
  v_entity_id := COALESCE(NEW.id, OLD.id);

  INSERT INTO public.audit_log (user_email, action_type, entity_id, table_name, details)
  VALUES (user_email_val, TG_OP || '_' || TG_TABLE_NAME, v_entity_id, TG_TABLE_NAME, details_val);

  RETURN COALESCE(NEW, OLD);
END;
$function$;
