import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FuncionariosConsolidatedStats {
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  funcionarios_exclusao_solicitada: number;
  pendencias_ativacao: number;
  pendencias_cancelamento: number;
  duplicatas_detectadas: Array<{
    cpf: string;
    nome: string;
    count: number;
    funcionario_ids: string[];
  }>;
}

export const useFuncionariosConsolidated = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['funcionarios-consolidated', user?.id],
    queryFn: async (): Promise<FuncionariosConsolidatedStats> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Query 1: Contar funcionários por status (direto da tabela funcionarios)
      const { data: funcionariosStats, error: funcError } = await supabase
        .from('funcionarios')
        .select(`
          status,
          cnpj_id,
          cnpjs!inner(
            empresa_id,
            empresas!inner(
              corretora_id
            )
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id);

      if (funcError) {
        console.error('Erro ao buscar estatísticas de funcionários:', funcError);
        throw funcError;
      }

      // Query 2: Contar pendências (da tabela pendencias)
      const { data: pendenciasStats, error: pendError } = await supabase
        .from('pendencias')
        .select('tipo, status')
        .eq('corretora_id', user.id)
        .eq('status', 'pendente');

      if (pendError) {
        console.error('Erro ao buscar estatísticas de pendências:', pendError);
        throw pendError;
      }

      // Query 3: Detectar duplicatas por CPF
      const { data: duplicatas, error: dupError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          cnpj_id,
          cnpjs!inner(
            empresa_id,
            empresas!inner(
              corretora_id
            )
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id);

      if (dupError) {
        console.error('Erro ao buscar duplicatas:', dupError);
        throw dupError;
      }

      // Processar estatísticas de funcionários
      const funcionariosData = funcionariosStats || [];
      const funcionarios_ativos = funcionariosData.filter(f => f.status === 'ativo').length;
      const funcionarios_pendentes = funcionariosData.filter(f => f.status === 'pendente').length;
      const funcionarios_exclusao_solicitada = funcionariosData.filter(f => f.status === 'exclusao_solicitada').length;

      // Processar estatísticas de pendências
      const pendenciasData = pendenciasStats || [];
      const pendencias_ativacao = pendenciasData.filter(p => p.tipo === 'ativacao').length;
      const pendencias_cancelamento = pendenciasData.filter(p => p.tipo === 'cancelamento').length;

      // Detectar duplicatas por CPF
      const cpfMap = new Map<string, Array<{ id: string; nome: string }>>();
      
      (duplicatas || []).forEach(func => {
        if (func.cpf) {
          const cleanCPF = func.cpf.replace(/\D/g, ''); // Remove formatação
          if (!cpfMap.has(cleanCPF)) {
            cpfMap.set(cleanCPF, []);
          }
          cpfMap.get(cleanCPF)!.push({ id: func.id, nome: func.nome });
        }
      });

      const duplicatas_detectadas = Array.from(cpfMap.entries())
        .filter(([cpf, funcionarios]) => funcionarios.length > 1)
        .map(([cpf, funcionarios]) => ({
          cpf,
          nome: funcionarios[0].nome,
          count: funcionarios.length,
          funcionario_ids: funcionarios.map(f => f.id)
        }));

      console.log('📊 Estatísticas consolidadas de funcionários:', {
        total: funcionariosData.length,
        ativos: funcionarios_ativos,
        pendentes: funcionarios_pendentes,
        exclusao: funcionarios_exclusao_solicitada,
        pendencias_ativacao,
        pendencias_cancelamento,
        duplicatas: duplicatas_detectadas.length
      });

      return {
        total_funcionarios: funcionariosData.length,
        funcionarios_ativos,
        funcionarios_pendentes,
        funcionarios_exclusao_solicitada,
        pendencias_ativacao,
        pendencias_cancelamento,
        duplicatas_detectadas
      };
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache por 30 segundos
    refetchInterval: 60000, // Auto-refresh a cada minuto
  });
};
