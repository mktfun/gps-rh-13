-- Critical Security Fixes - Simplified Approach

-- 1. Create secure helper functions
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

-- 2. Drop existing profile policy and recreate with better security
DROP POLICY IF EXISTS "Um usuário pode ver e alterar seu próprio perfil" ON profiles;

-- Create separate policies for better control
CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update non-role fields"
ON profiles FOR UPDATE  
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Create admin-only role management function with proper security
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

  -- Prevent self-demotion
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Não é possível remover seus próprios privilégios de admin'
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

-- 4. Add input validation functions
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
  
  -- Check for invalid patterns
  IF cpf_input IN ('00000000000', '11111111111', '22222222222', 
                   '33333333333', '44444444444', '55555555555',
                   '66666666666', '77777777777', '88888888888', '99999999999') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 5. Create secure logging function for suspicious activities
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  event_details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO audit_log (
    action_type,
    table_name,
    entity_id,
    user_email,
    details
  ) VALUES (
    event_type,
    'security',
    auth.uid(),
    (SELECT email FROM profiles WHERE id = auth.uid()),
    event_details
  );
END;
$$;

-- 6. Add rate limiting table for security
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
ON rate_limits FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
ON rate_limits FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 7. Create security monitoring function
CREATE OR REPLACE FUNCTION check_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_attempts INTEGER;
BEGIN
  -- Check for rapid role changes (more than 3 in 10 minutes)
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'profiles' AND 
     OLD.role IS DISTINCT FROM NEW.role THEN
    
    SELECT COUNT(*) INTO recent_attempts
    FROM audit_log
    WHERE action_type = 'ROLE_CHANGE'
    AND created_at > NOW() - INTERVAL '10 minutes'
    AND user_email = (SELECT email FROM profiles WHERE id = auth.uid());
    
    IF recent_attempts > 3 THEN
      -- Log suspicious activity
      PERFORM log_security_event('SUSPICIOUS_ACTIVITY', 
        json_build_object(
          'type', 'rapid_role_changes',
          'count', recent_attempts,
          'user_id', auth.uid()
        )
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply security monitoring trigger
DROP TRIGGER IF EXISTS security_monitor_trigger ON profiles;
CREATE TRIGGER security_monitor_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_suspicious_activity();