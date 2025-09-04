import React from 'react';
import { FuncionarioData } from '@/types/supabase-json';

interface PlanoVisaoGeralTabProps {
  planoId: string;
}

export default function PlanoVisaoGeralTab({ planoId }: PlanoVisaoGeralTabProps) {
  // Stub temporário para corrigir build
  const funcionarioData: FuncionarioData[] = [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Visão Geral do Plano
            </h2>
            <p className="text-gray-600 mb-4">
              {funcionarioData.length} funcionários vinculados
            </p>
          </div>
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        Componente em desenvolvimento
      </div>
    </div>
  );
}