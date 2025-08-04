
-- Criar trigger para gerar notificações automáticas quando o status de funcionários for alterado
CREATE OR REPLACE TRIGGER employee_status_change_trigger
  AFTER UPDATE OF status ON public.funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_status_change();

-- Verificar se o trigger foi criado corretamente
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'employee_status_change_trigger';
