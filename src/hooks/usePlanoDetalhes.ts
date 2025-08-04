
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  tipo_seguro: 'vida' | 'saude' | 'outros';
}

interface FuncionarioPlano {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  data_nascimento?: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
  created_at: string;
}

export const usePlanoDetalhes = (cnpjId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['plano-detalhes', cnpjId],
    queryFn: async () => {
      console.log('🔍 usePlanoDetalhes - Buscando dados do plano para cnpjId:', cnpjId);
      
      if (!cnpjId) {
        console.error('❌ usePlanoDetalhes - cnpjId não fornecido');
        throw new Error('ID do CNPJ não fornecido');
      }

      // Primeiro, verificar se o CNPJ existe
      const { data: cnpjExists, error: cnpjError } = await supabase
        .from('cnpjs')
        .select('id, cnpj, razao_social')
        .eq('id', cnpjId)
        .maybeSingle();

      if (cnpjError) {
        console.error('❌ usePlanoDetalhes - Erro ao verificar CNPJ:', cnpjError);
        throw new Error(`Erro ao verificar CNPJ: ${cnpjError.message}`);
      }

      if (!cnpjExists) {
        console.error('❌ usePlanoDetalhes - CNPJ não encontrado:', cnpjId);
        throw new Error('CNPJ não encontrado no sistema');
      }

      console.log('✅ usePlanoDetalhes - CNPJ existe:', cnpjExists);

      // Buscar dados do plano usando cnpj_id
      const { data: planoData, error: planoError } = await supabase
        .from('dados_planos')
        .select(`
          *,
          cnpjs!inner(
            id,
            cnpj,
            razao_social,
            empresas!inner(
              nome
            )
          )
        `)
        .eq('cnpj_id', cnpjId)
        .maybeSingle();

      if (planoError) {
        console.error('❌ usePlanoDetalhes - Erro ao buscar plano:', planoError);
        throw new Error(`Erro ao buscar plano: ${planoError.message}`);
      }

      if (!planoData) {
        console.warn('⚠️ usePlanoDetalhes - Nenhum plano encontrado para cnpjId:', cnpjId);
        // Retornar dados básicos do CNPJ mesmo sem plano
        return {
          plano: null,
          funcionarios: [],
          cnpjInfo: cnpjExists
        };
      }

      // Buscar funcionários vinculados ao CNPJ - INCLUINDO exclusao_solicitada
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          email,
          data_nascimento,
          cargo,
          salario,
          idade,
          status,
          created_at
        `)
        .eq('cnpj_id', cnpjId)
        .in('status', ['ativo', 'pendente', 'exclusao_solicitada']);

      if (funcionariosError) {
        console.error('❌ usePlanoDetalhes - Erro ao buscar funcionários:', funcionariosError);
        throw new Error(`Erro ao buscar funcionários: ${funcionariosError.message}`);
      }

      // Formatar dados do plano
      const planoFormatado: PlanoDetalhes = {
        id: planoData.id,
        cnpj_id: planoData.cnpj_id,
        empresa_nome: planoData.cnpjs.empresas.nome,
        cnpj_razao_social: planoData.cnpjs.razao_social,
        cnpj_numero: planoData.cnpjs.cnpj,
        seguradora: planoData.seguradora,
        valor_mensal: planoData.valor_mensal,
        cobertura_morte: planoData.cobertura_morte,
        cobertura_morte_acidental: planoData.cobertura_morte_acidental,
        cobertura_invalidez_acidente: planoData.cobertura_invalidez_acidente,
        cobertura_auxilio_funeral: planoData.cobertura_auxilio_funeral,
        tipo_seguro: planoData.tipo_seguro || 'vida',
      };

      console.log('✅ usePlanoDetalhes - Dados encontrados:', {
        plano: planoFormatado,
        funcionarios: funcionariosData?.length || 0
      });

      return {
        plano: planoFormatado,
        funcionarios: funcionariosData as FuncionarioPlano[],
        cnpjInfo: cnpjExists
      };
    },
    enabled: !!cnpjId,
    retry: (failureCount, error) => {
      // Não fazer retry para erros de CNPJ não encontrado
      if (error?.message?.includes('não encontrado')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  return {
    plano: data?.plano,
    funcionarios: data?.funcionarios || [],
    cnpjInfo: data?.cnpjInfo,
    isLoading,
    error
  };
};
