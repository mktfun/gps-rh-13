import React from 'react';
import { FuncionarioData } from '@/types/supabase-json';

interface PlanoFuncionariosTabProps {
  planoId: string;
}

export default function PlanoFuncionariosTab({ planoId }: PlanoFuncionariosTabProps) {
  // Stub temporário para corrigir build
  const funcionarioData: FuncionarioData[] = [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Funcionários do Plano</h3>
          <p className="text-sm text-muted-foreground">
            {funcionarioData.length} funcionário(s) vinculado(s) a este plano
          </p>
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        Componente em desenvolvimento
      </div>
    </div>
  );
}