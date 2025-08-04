
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Building2, 
  Users, 
  FileText, 
  Upload, 
  Download, 
  Settings,
  BarChart3,
  Shield,
  UserPlus
} from 'lucide-react';
import { useActionContext } from '@/utils/actionContext';

export interface QuickAction {
  id: string;
  label: string;
  icon: any;
  action: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  disabled?: boolean;
}

export const useQuickActions = () => {
  const navigate = useNavigate();
  const context = useActionContext();

  const actions = useMemo((): QuickAction[] => {
    if (!context.userRole) return [];

    const baseActions: QuickAction[] = [];

    // Ações para Corretora
    if (context.userRole === 'corretora') {
      switch (context.contextType) {
        case 'dashboard':
          baseActions.push(
            {
              id: 'nova-empresa',
              label: 'Nova Empresa',
              icon: Building2,
              action: () => navigate('/corretora/empresas?modal=new')
            },
            {
              id: 'importar-funcionarios',
              label: 'Importar Funcionários',
              icon: Upload,
              action: () => navigate('/corretora/empresas?action=import')
            },
            {
              id: 'relatorio-geral',
              label: 'Relatório Geral',
              icon: BarChart3,
              action: () => navigate('/corretora/relatorios/financeiro')
            }
          );
          break;

        case 'empresas':
          baseActions.push(
            {
              id: 'nova-empresa',
              label: 'Nova Empresa',
              icon: Plus,
              action: () => navigate('/corretora/empresas?modal=new')
            },
            {
              id: 'exportar-lista',
              label: 'Exportar Lista',
              icon: Download,
              action: () => {
                // TODO: Implementar exportação
                console.log('Exportar lista de empresas');
              }
            }
          );
          break;

        case 'empresa-detalhes':
          baseActions.push(
            {
              id: 'novo-cnpj',
              label: 'Novo CNPJ',
              icon: Plus,
              action: () => navigate(`${context.currentRoute}?modal=new-cnpj`)
            },
            {
              id: 'novo-funcionario',
              label: 'Novo Funcionário',
              icon: UserPlus,
              action: () => navigate(`${context.currentRoute}?modal=new-funcionario`)
            },
            {
              id: 'novo-plano',
              label: 'Novo Plano',
              icon: Shield,
              action: () => navigate(`${context.currentRoute}?modal=new-plano`)
            }
          );
          break;

        case 'cnpjs':
          baseActions.push(
            {
              id: 'novo-plano',
              label: 'Novo Plano',
              icon: Shield,
              action: () => navigate(`${context.currentRoute}?modal=new-plano`)
            },
            {
              id: 'importar-funcionarios-massa',
              label: 'Importação em Massa',
              icon: Upload,
              action: () => navigate(`${context.currentRoute}?action=bulk-import`)
            }
          );
          break;

        case 'funcionarios':
          baseActions.push(
            {
              id: 'novo-funcionario',
              label: 'Novo Funcionário',
              icon: Plus,
              action: () => navigate(`${context.currentRoute}?modal=new`)
            },
            {
              id: 'ativar-pendentes',
              label: 'Ativar Pendentes',
              icon: UserPlus,
              action: () => {
                // TODO: Implementar ativação em massa
                console.log('Ativar funcionários pendentes');
              }
            },
            {
              id: 'exportar-funcionarios',
              label: 'Exportar Lista',
              icon: Download,
              action: () => {
                // TODO: Implementar exportação
                console.log('Exportar funcionários');
              }
            }
          );
          break;

        case 'relatorios':
          baseActions.push(
            {
              id: 'gerar-relatorio',
              label: 'Gerar Relatório',
              icon: FileText,
              action: () => {
                // TODO: Implementar geração de relatório
                console.log('Gerar relatório personalizado');
              }
            },
            {
              id: 'exportar-dados',
              label: 'Exportar Dados',
              icon: Download,
              action: () => {
                // TODO: Implementar exportação de dados
                console.log('Exportar dados do relatório');
              }
            }
          );
          break;
      }
    }

    // Ações para Empresa
    if (context.userRole === 'empresa') {
      switch (context.contextType) {
        case 'dashboard':
          baseActions.push(
            {
              id: 'novo-funcionario',
              label: 'Novo Funcionário',
              icon: UserPlus,
              action: () => navigate('/empresa/funcionarios?modal=new')
            },
            {
              id: 'ver-planos',
              label: 'Ver Meus Planos',
              icon: Shield,
              action: () => navigate('/empresa/planos')
            },
            {
              id: 'solicitar-alteracao',
              label: 'Solicitar Alteração',
              icon: FileText,
              action: () => navigate('/empresa/solicitacoes?action=new')
            }
          );
          break;

        case 'funcionarios':
          baseActions.push(
            {
              id: 'novo-funcionario',
              label: 'Novo Funcionário',
              icon: Plus,
              action: () => navigate(`${context.currentRoute}?modal=new`)
            },
            {
              id: 'exportar-lista',
              label: 'Exportar Lista',
              icon: Download,
              action: () => {
                // TODO: Implementar exportação
                console.log('Exportar lista de funcionários');
              }
            }
          );
          break;

        case 'relatorios':
          baseActions.push(
            {
              id: 'gerar-relatorio',
              label: 'Gerar Relatório',
              icon: FileText,
              action: () => {
                // TODO: Implementar geração
                console.log('Gerar relatório personalizado');
              }
            },
            {
              id: 'exportar-dados',
              label: 'Exportar Dados',
              icon: Download,
              action: () => {
                // TODO: Implementar exportação
                console.log('Exportar dados do relatório');
              }
            }
          );
          break;
      }
    }

    // Ações comuns (configurações)
    if (context.contextType === 'configuracoes') {
      baseActions.push(
        {
          id: 'salvar-configuracoes',
          label: 'Salvar Alterações',
          icon: Settings,
          action: () => {
            // TODO: Implementar salvamento
            console.log('Salvar configurações');
          }
        }
      );
    }

    return baseActions;
  }, [context, navigate]);

  return {
    actions,
    context,
  };
};
