
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  seguradora: string;
}

interface FuncionariosTabProps {
  plano: PlanoDetalhes;
}

export const FuncionariosTab: React.FC<FuncionariosTabProps> = ({ plano }) => {
  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Ativos</span>
            </div>
            <div className="text-2xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Custo Total</span>
            </div>
            <div className="text-2xl font-bold text-green-600">R$ 0,00</div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e Tabela */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários do Plano
            </CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca e Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário por nome, CPF ou email..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Todos</Badge>
              <Badge variant="outline">Ativos</Badge>
              <Badge variant="outline">Pendentes</Badge>
            </div>
          </div>

          {/* Placeholder para a tabela */}
          <div className="border rounded-lg p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum funcionário encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Não há funcionários vinculados a este plano ainda.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Funcionário
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
