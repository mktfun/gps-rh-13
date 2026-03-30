import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type EstadoCivil = Database['public']['Enums']['estado_civil'];

interface CriarFuncionarioData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  data_admissao?: string;
  cargo: string;
  salario: number;
  estado_civil: EstadoCivil;
  email?: string;
  cnpj_id: string;
  incluir_saude: boolean;
  incluir_vida: boolean;
}

export const useCriarFuncionarioComPlanos = () => {
  const queryClient = useQueryClient();

  const criarFuncionario = useMutation({
    mutationFn: async (data: CriarFuncionarioData) => {
      logger.info('🔄 Criando funcionário com planos selecionados:', data);

      const { data: result, error } = await supabase.rpc('criar_funcionario_com_planos', {
        p_nome: data.nome,
        p_cpf: data.cpf,
        p_data_nascimento: data.data_nascimento,
        p_data_admissao: data.data_admissao || null,
        p_cargo: data.cargo,
        p_salario: data.salario,
        p_estado_civil: data.estado_civil,
        p_email: data.email || null,
        p_cnpj_id: data.cnpj_id,
        p_incluir_saude: data.incluir_saude,
        p_incluir_vida: data.incluir_vida,
      });

      if (error) {
        logger.error('❌ Erro ao criar funcionário:', error);
        throw error;
      }

      logger.info('✅ Funcionário criado:', result);
      return result;
    },
    onSuccess: (result: any) => {
      logger.info('🎉 Funcionário criado com sucesso!');
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      queryClient.invalidateQueries({ queryKey: ['empresasComPlanos'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardActions'] });
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard-actions-detailed'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['empresas-com-metricas'] });

      const pendenciasMsg = result.pendencias_criadas > 0 
        ? ` ${result.pendencias_criadas} pendência(s) de ativação criada(s).`
        : ' Nenhuma pendência criada (nenhum plano selecionado).';
      
      toast.success(`Funcionário cadastrado com sucesso!${pendenciasMsg}`);
    },
    onError: (error: any) => {
      logger.error('💥 Erro ao criar funcionário:', error);
      const msg = error?.message || '';
      
      if (msg.includes('check_salario_positivo')) {
        toast.error('Salário deve ser maior que zero. Verifique o valor informado.');
      } else if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        toast.error('Este CPF já está cadastrado nesta empresa.');
      } else if (msg.includes('já possui um plano do tipo')) {
        toast.error(msg);
      } else {
        toast.error(msg || 'Erro ao cadastrar funcionário. Tente novamente.');
      }
    },
  });

  return {
    criarFuncionario,
    isCreating: criarFuncionario.isPending,
  };
};
