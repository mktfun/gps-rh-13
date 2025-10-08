import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type EstadoCivil = Database['public']['Enums']['estado_civil'];

interface CriarFuncionarioData {
  nome: string;
  cpf: string;
  data_nascimento: string;
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
      console.log('🔄 Criando funcionário com planos selecionados:', data);

      const { data: result, error } = await supabase.rpc('criar_funcionario_com_planos', {
        p_nome: data.nome,
        p_cpf: data.cpf,
        p_data_nascimento: data.data_nascimento,
        p_cargo: data.cargo,
        p_salario: data.salario,
        p_estado_civil: data.estado_civil,
        p_email: data.email || null,
        p_cnpj_id: data.cnpj_id,
        p_incluir_saude: data.incluir_saude,
        p_incluir_vida: data.incluir_vida,
      });

      if (error) {
        console.error('❌ Erro ao criar funcionário:', error);
        throw error;
      }

      console.log('✅ Funcionário criado:', result);
      return result;
    },
    onSuccess: (result: any) => {
      console.log('🎉 Funcionário criado com sucesso!');
      
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
      console.error('💥 Erro ao criar funcionário:', error);
      toast.error(error?.message || 'Erro ao cadastrar funcionário');
    },
  });

  return {
    criarFuncionario,
    isCreating: criarFuncionario.isPending,
  };
};
