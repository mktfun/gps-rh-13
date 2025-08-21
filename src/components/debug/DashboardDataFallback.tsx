import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Database, Settings } from 'lucide-react';

interface DashboardFallbackProps {
  onConnect?: () => void;
}

export function DashboardDataFallback({ onConnect }: DashboardFallbackProps) {
  return (
    <div className="space-y-6">
      {/* Alert principal */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Configuração do Dashboard Necessária
            </h3>
            <p className="text-yellow-800 mb-4">
              O dashboard da empresa precisa ser conectado ao Supabase para funcionar corretamente. 
              Use a conexão MCP para configurar rapidamente.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onConnect}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Database className="h-4 w-4" />
                Conectar ao Supabase
              </button>
              <span className="text-sm text-yellow-700">ou configure manualmente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards com dados de exemplo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-500 mt-1">Aguardando dados</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Funcionários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-500 mt-1">Aguardando dados</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Funcionários Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">--</p>
            <p className="text-xs text-gray-500 mt-1">Aguardando dados</p>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Custo Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-400">R$ --</p>
            <p className="text-xs text-gray-500 mt-1">Aguardando dados</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de instruções */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Como Configurar o Dashboard</CardTitle>
              <CardDescription>
                Siga estes passos para conectar seu dashboard ao banco de dados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Opção 1: Conexão Automática (Recomendado)</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Clique no botão "Conectar ao Supabase" acima</li>
              <li>Configure suas credenciais do Supabase</li>
              <li>Execute os scripts de migração fornecidos</li>
              <li>Teste a conexão</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Opção 2: Configuração Manual</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Configure as variáveis de ambiente do Supabase</li>
              <li>Execute as migrações do banco usando o schema fornecido</li>
              <li>Verifique se a função RPC `get_empresa_dashboard_metrics` existe</li>
              <li>Teste a conexão no console do navegador</li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <h5 className="text-sm font-medium text-blue-900 mb-1">Documento de Schema</h5>
                <p className="text-sm text-blue-800">
                  Um arquivo <code>SCHEMA_SUPABASE_EXEMPLO.md</code> foi criado na raiz do projeto 
                  com todas as tabelas e dados de exemplo necessários.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
