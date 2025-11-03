import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanoFuncionario } from './usePlanoFuncionarios';

interface UsePlanoFuncionariosExportParams {
  planoId: string;
  tipoSeguro: string;
  statusFilter?: string;
  search?: string;
}

export const usePlanoFuncionariosExport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllFuncionarios = async ({
    planoId,
    tipoSeguro,
    statusFilter,
    search
  }: UsePlanoFuncionariosExportParams): Promise<PlanoFuncionario[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📥 Buscando TODOS os funcionários para exportação:', {
        planoId,
        tipoSeguro,
        statusFilter,
        search
      });

      // Chamar a mesma RPC, mas com pageSize = 999999 para pegar tudo
      const { data, error: rpcError } = await supabase.rpc('get_funcionarios_por_plano', {
        p_plano_id: planoId,
        p_status_filter: statusFilter || null,
        p_search: search || null,
        p_page_index: 0,
        p_page_size: 999999 // Pega todos os registros
      });

      if (rpcError) {
        console.error('❌ Erro ao buscar funcionários para exportação:', rpcError);
        throw rpcError;
      }

      const funcionarios: PlanoFuncionario[] = (data || []).map((row: any) => ({
        id: row.funcionario_id,
        nome: row.nome,
        cpf: row.cpf,
        data_nascimento: row.data_nascimento,
        cargo: row.cargo,
        salario: row.salario,
        email: row.email,
        cnpj_id: row.cnpj_id,
        status: row.status,
        idade: row.idade,
        created_at: row.created_at,
        matricula_id: row.matricula_id,
        funcionario_id: row.funcionario_id,
        custo_individual: Number(row.custo_individual) || 0
      }));

      console.log('✅ Total de funcionários carregados para exportação:', funcionarios.length);
      
      setIsLoading(false);
      return funcionarios;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    fetchAllFuncionarios,
    isLoading,
    error
  };
};
