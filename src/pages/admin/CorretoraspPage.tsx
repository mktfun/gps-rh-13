
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ToggleLeft, ToggleRight, Clock } from 'lucide-react';
import { useCorretoras } from '@/hooks/useCorretoras';
import { PulseLoader } from '@/components/ui/enhanced-loading';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CorretoraspPage = () => {
  const { corretoras, isLoading, toggleStatus } = useCorretoras();

  const getStatusBadge = (status: string) => {
    if (status === 'ativo') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
        Inativo
      </Badge>
    );
  };

  const handleToggleStatus = async (corretora: any) => {
    const acao = corretora.status === 'ativo' ? 'desativar' : 'ativar';
    
    if (window.confirm(`Tem certeza que deseja ${acao} a corretora "${corretora.nome}"?`)) {
      toggleStatus.mutate(corretora.id);
    }
  };

  const getToggleIcon = (status: string, isLoading: boolean) => {
    if (isLoading) {
      return <PulseLoader size="sm" />;
    }
    
    return status === 'ativo' ? (
      <ToggleRight className="h-4 w-4 text-green-600" />
    ) : (
      <ToggleLeft className="h-4 w-4 text-red-600" />
    );
  };

  const stats = {
    total: corretoras.length,
    ativas: corretoras.filter(c => c.status === 'ativo').length,
    inativas: corretoras.filter(c => c.status === 'inativo').length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Gestão de Corretoras
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie o status e acesso das corretoras na plataforma
            </p>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <PulseLoader size="sm" />
              <span>Carregando...</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Corretoras</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Cadastradas na plataforma
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corretoras Ativas</CardTitle>
              <ToggleRight className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
              <p className="text-xs text-muted-foreground">
                Com acesso ao sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corretoras Inativas</CardTitle>
              <ToggleLeft className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inativas}</div>
              <p className="text-xs text-muted-foreground">
                Sem acesso ao sistema
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Corretoras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Lista de Corretoras
            </CardTitle>
            <CardDescription>
              Visualize e gerencie o status de todas as corretoras cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nome</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Data de Cadastro</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-20 bg-muted rounded animate-pulse ml-auto"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : corretoras.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="space-y-2">
                          <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                          <p className="text-muted-foreground text-lg">
                            Nenhuma corretora cadastrada
                          </p>
                          <p className="text-sm text-muted-foreground">
                            As corretoras aparecerão aqui quando forem cadastradas
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    corretoras.map((corretora) => (
                      <TableRow key={corretora.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{corretora.nome}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {corretora.id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm">{corretora.email}</span>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(corretora.status)}
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(corretora.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant={corretora.status === 'ativo' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(corretora)}
                            disabled={toggleStatus.isPending}
                            className="flex items-center gap-2"
                          >
                            {getToggleIcon(corretora.status, toggleStatus.isPending)}
                            {corretora.status === 'ativo' ? 'Desativar' : 'Ativar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CorretoraspPage;
