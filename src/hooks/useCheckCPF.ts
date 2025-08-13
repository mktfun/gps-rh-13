import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

interface UseCheckCPFProps {
  cpf: string;
  cnpjId?: string;
  enabled?: boolean;
}

export const useCheckCPF = ({ cpf, cnpjId, enabled = true }: UseCheckCPFProps) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [existingFuncionario, setExistingFuncionario] = useState<{ nome: string } | null>(null);
  
  const debouncedCPF = useDebounce(cpf, 500);

  useEffect(() => {
    const checkCPF = async () => {
      if (!enabled || !debouncedCPF || !cnpjId || debouncedCPF.length < 11) {
        setIsDuplicate(false);
        setExistingFuncionario(null);
        return;
      }

      setIsChecking(true);
      
      try {
        const cleanCPF = debouncedCPF.replace(/\D/g, '');
        
        const { data: existing, error } = await supabase
          .from('funcionarios')
          .select('id, nome, cpf')
          .eq('cpf', cleanCPF)
          .eq('cnpj_id', cnpjId)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar CPF:', error);
          return;
        }

        if (existing) {
          setIsDuplicate(true);
          setExistingFuncionario({ nome: existing.nome });
        } else {
          setIsDuplicate(false);
          setExistingFuncionario(null);
        }
      } catch (error) {
        console.error('Erro ao verificar CPF:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkCPF();
  }, [debouncedCPF, cnpjId, enabled]);

  return {
    isChecking,
    isDuplicate,
    existingFuncionario
  };
};
