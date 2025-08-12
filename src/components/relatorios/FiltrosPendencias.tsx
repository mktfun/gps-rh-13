
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export interface FiltrosState {
  inicio?: string | null; // yyyy-mm-dd
  fim?: string | null;    // yyyy-mm-dd
  status?: 'critico' | 'urgente' | 'normal' | 'todas';
  tipo?: 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento' | 'todas';
  empresaId?: string | 'todas';
  cnpjId?: string | 'todas';
  search?: string;
}

interface EmpresaOption {
  id: string;
  nome: string;
}

interface CnpjOption {
  id: string;
  cnpj: string;
  razao_social: string;
}

interface Props {
  value: FiltrosState;
  onChange: (next: FiltrosState) => void;
  empresas: EmpresaOption[];
  cnpjs: CnpjOption[];
  loadingCnpjs?: boolean;
  onBuscar?: () => void;
}

const FiltrosPendencias: React.FC<Props> = ({
  value,
  onChange,
  empresas,
  cnpjs,
  loadingCnpjs,
  onBuscar
}) => {
  const set = (patch: Partial<FiltrosState>) => onChange({ ...value, ...patch });

  return (
    <Card className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <div className="space-y-2">
        <Label>Início</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={value.inicio || ''}
            onChange={(e) => set({ inicio: e.target.value || null })}
          />
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Fim</Label>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={value.fim || ''}
            onChange={(e) => set({ fim: e.target.value || null })}
          />
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={value.status || 'todas'}
          onValueChange={(v) => set({ status: v as any })}
        >
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos</SelectItem>
            <SelectItem value="critico">Crítico</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={value.tipo || 'todas'}
          onValueChange={(v) => set({ tipo: v as any })}
        >
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos</SelectItem>
            <SelectItem value="documentacao">Documentação</SelectItem>
            <SelectItem value="ativacao">Ativação</SelectItem>
            <SelectItem value="alteracao">Alteração</SelectItem>
            <SelectItem value="cancelamento">Cancelamento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Empresa</Label>
        <Select
          value={value.empresaId || 'todas'}
          onValueChange={(v) => set({ empresaId: v === 'todas' ? undefined : v, cnpjId: undefined })}
        >
          <SelectTrigger><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>CNPJ</Label>
        <Select
          value={value.cnpjId || 'todas'}
          onValueChange={(v) => set({ cnpjId: v === 'todas' ? undefined : v })}
          disabled={loadingCnpjs}
        >
          <SelectTrigger><SelectValue placeholder="CNPJ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos</SelectItem>
            {cnpjs.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.cnpj} — {c.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2 lg:col-span-3 space-y-2">
        <Label>Busca (protocolo / funcionário / razão social)</Label>
        <Input
          placeholder="Ex.: 2024-000123, João, Acme Ltda"
          value={value.search || ''}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>

      <div className="flex items-end">
        <Button className="w-full" onClick={onBuscar}>Aplicar filtros</Button>
      </div>
    </Card>
  );
};

export default FiltrosPendencias;
