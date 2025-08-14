import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, Edit } from 'lucide-react';

interface FaixaEtaria {
  faixa: string;
  valorMensal: number;
  vidas: number;
  total: number;
}

interface ValoresVidaTableProps {
  valorMensal: number;
  funcionarios: Array<{ idade: number; status: string }>;
}

export const ValoresVidaTable: React.FC<ValoresVidaTableProps> = ({
  valorMensal,
  funcionarios
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Agrupar funcionários ativos por faixa etária
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');
  
  const faixasEtarias: FaixaEtaria[] = [
    {
      faixa: '00-18 anos',
      valorMensal: valorMensal * 0.6, // 40% de desconto para menores
      vidas: funcionariosAtivos.filter(f => f.idade >= 0 && f.idade <= 18).length,
      total: 0
    },
    {
      faixa: '19-23 anos',
      valorMensal: valorMensal * 0.8, // 20% de desconto para jovens
      vidas: funcionariosAtivos.filter(f => f.idade >= 19 && f.idade <= 23).length,
      total: 0
    },
    {
      faixa: '24-28 anos',
      valorMensal: valorMensal,
      vidas: funcionariosAtivos.filter(f => f.idade >= 24 && f.idade <= 28).length,
      total: 0
    },
    {
      faixa: '29-33 anos',
      valorMensal: valorMensal * 1.1, // 10% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 29 && f.idade <= 33).length,
      total: 0
    },
    {
      faixa: '34-38 anos',
      valorMensal: valorMensal * 1.2, // 20% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 34 && f.idade <= 38).length,
      total: 0
    },
    {
      faixa: '39-43 anos',
      valorMensal: valorMensal * 1.4, // 40% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 39 && f.idade <= 43).length,
      total: 0
    },
    {
      faixa: '44-48 anos',
      valorMensal: valorMensal * 1.6, // 60% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 44 && f.idade <= 48).length,
      total: 0
    },
    {
      faixa: '49-53 anos',
      valorMensal: valorMensal * 1.9, // 90% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 49 && f.idade <= 53).length,
      total: 0
    },
    {
      faixa: '54-58 anos',
      valorMensal: valorMensal * 2.3, // 130% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 54 && f.idade <= 58).length,
      total: 0
    },
    {
      faixa: '59+ anos',
      valorMensal: valorMensal * 2.8, // 180% de acréscimo
      vidas: funcionariosAtivos.filter(f => f.idade >= 59).length,
      total: 0
    }
  ];

  // Calcular totais
  faixasEtarias.forEach(faixa => {
    faixa.total = faixa.valorMensal * faixa.vidas;
  });

  // Filtrar apenas faixas com vidas para exibir
  const faixasComVidas = faixasEtarias.filter(faixa => faixa.vidas > 0);
  
  const totalGeral = faixasEtarias.reduce((acc, faixa) => acc + faixa.total, 0);
  const totalVidas = funcionariosAtivos.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Valores de Vida
        </CardTitle>
      </CardHeader>
      <CardContent>
        {faixasComVidas.length > 0 ? (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Faixa Etária</TableHead>
                  <TableHead className="text-right">Valor Mensal (R$)</TableHead>
                  <TableHead className="text-center">Vidas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faixasComVidas.map((faixa, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{faixa.faixa}</TableCell>
                    <TableCell className="text-right">{formatCurrency(faixa.valorMensal)}</TableCell>
                    <TableCell className="text-center">{faixa.vidas}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(faixa.total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-bold">Total Geral</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-center font-bold">{totalVidas}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{formatCurrency(totalGeral)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {onEditValores && (
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={onEditValores}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Valores
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum funcionário ativo</p>
            <p className="text-sm">Adicione funcionários para visualizar os valores de vida</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
