-- Phase 1: Critical Database Security Fixes

-- 1. Create secure helper functions to replace users_view exposure
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT empresa_id FROM profiles WHERE id = auth.uid();
$$;

-- 2. Add RLS policy to prevent users from changing their own role
DROP POLICY IF EXISTS "Um usuário pode ver e alterar seu próprio perfil" ON profiles;

-- Split into separate policies for better security
CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile except role"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  (OLD.role = NEW.role OR get_my_role() = 'admin')
);

-- 3. Create admin-only role management function
CREATE OR REPLACE FUNCTION admin_update_user_role(
  target_user_id UUID,
  new_role user_role
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_admin_role TEXT;
  old_role user_role;
  target_user_name TEXT;
BEGIN
  -- Verify admin privileges
  SELECT role INTO current_admin_role FROM profiles WHERE id = auth.uid();
  
  IF current_admin_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Acesso negado: apenas administradores podem alterar roles'
    );
  END IF;

  -- Get current user data for audit
  SELECT role, nome INTO old_role, target_user_name 
  FROM profiles 
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Update role
  UPDATE profiles 
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  -- Log the role change
  INSERT INTO audit_log (
    action_type,
    table_name,
    entity_id,
    user_email,
    details
  ) VALUES (
    'ROLE_CHANGE',
    'profiles',
    target_user_id,
    (SELECT email FROM profiles WHERE id = auth.uid()),
    json_build_object(
      'target_user', target_user_name,
      'old_role', old_role,
      'new_role', new_role,
      'changed_by', auth.uid()
    )
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Role atualizado com sucesso',
    'old_role', old_role,
    'new_role', new_role
  );
END;
$$;

-- 4. Fix search_path vulnerability in existing functions
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT
  INTO v_role
  FROM profiles
  WHERE id = p_user_id;

  RETURN v_role;
END;
$$;

-- 5. Add input validation function
CREATE OR REPLACE FUNCTION validate_cpf(cpf_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Remove non-numeric characters
  cpf_input := regexp_replace(cpf_input, '[^0-9]', '', 'g');
  
  -- Check length
  IF length(cpf_input) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Check for invalid patterns (all same digits)
  IF cpf_input IN ('00000000000', '11111111111', '22222222222', 
                   '33333333333', '44444444444', '55555555555',
                   '66666666666', '77777777777', '88888888888', '99999999999') THEN
    RETURN FALSE;
  END IF;
  
  -- Basic CPF validation algorithm would go here
  -- For now, just return true for length and pattern validation
  RETURN TRUE;
END;
$$;

-- 6. Add security audit trigger for profile changes
CREATE OR REPLACE FUNCTION audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log role changes specifically
  IF OLD.role != NEW.role THEN
    INSERT INTO audit_log (
      action_type,
      table_name,
      entity_id,
      user_email,
      details
    ) VALUES (
      'ROLE_CHANGE',
      'profiles',
      NEW.id,
      NEW.email,
      json_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid(),
        'timestamp', NOW()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS audit_profile_changes_trigger ON profiles;
CREATE TRIGGER audit_profile_changes_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_changes();

-- 7. Create security monitoring view for admins
CREATE OR REPLACE VIEW security_events AS
SELECT 
  al.id,
  al.action_type,
  al.user_email,
  al.created_at,
  al.details,
  p.nome as user_name,
  p.role as user_role
FROM audit_log al
LEFT JOIN profiles p ON p.email = al.user_email
WHERE al.action_type IN ('ROLE_CHANGE', 'SECURITY_VIOLATION', 'SUSPICIOUS_ACTIVITY')
ORDER BY al.created_at DESC;

-- RLS for security events view
CREATE POLICY "Admins can view security events"
ON audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);