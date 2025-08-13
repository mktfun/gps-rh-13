-- Auto-resolve activation pendencias when employees are activated
-- This fixes the issue where pendencias remain 'pendente' even after employees are activated

-- Function to resolve activation pendencias when employee is activated
CREATE OR REPLACE FUNCTION public.resolver_pendencias_ativacao_automatica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only process when status changes to 'ativo'
  IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') THEN
    
    -- Update all pending activation pendencias for this employee to resolved
    UPDATE public.pendencias
    SET 
      status = 'resolvida',
      updated_at = NOW()
    WHERE funcionario_id = NEW.id
      AND tipo = 'ativacao'
      AND status = 'pendente';
    
    -- Log the resolution
    RAISE NOTICE 'Auto-resolved activation pendencias for employee %', NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-resolve activation pendencias
DROP TRIGGER IF EXISTS trg_resolver_pendencias_ativacao ON public.funcionarios;

CREATE TRIGGER trg_resolver_pendencias_ativacao
  AFTER UPDATE OF status ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.resolver_pendencias_ativacao_automatica();

-- Clean up existing unresolved activation pendencias for already active employees
-- This fixes the current state where there are 8 pendencias but only 4 employees
UPDATE public.pendencias
SET 
  status = 'resolvida',
  updated_at = NOW()
WHERE tipo = 'ativacao'
  AND status = 'pendente'
  AND funcionario_id IN (
    SELECT id 
    FROM public.funcionarios 
    WHERE status = 'ativo'
  );
