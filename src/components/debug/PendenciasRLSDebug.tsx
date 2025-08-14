
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DebugResult {
  currentUser: any;
  profile: any;
  debugRLS: any;
  testInsert: any;
  error?: string;
}

export const PendenciasRLSDebug: React.FC = () => {
  const [corretoraId, setCorretoraId] = useState('');
  const [result, setResult] = useState<DebugResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const debugResult: DebugResult = {
        currentUser: null,
        profile: null,
        debugRLS: null,
        testInsert: null
      };

      // 1. Get current user
      const { data: currentUser, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      debugResult.currentUser = currentUser.user;

      // 2. Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.user?.id)
        .single();
      
      if (profileError) throw profileError;
      debugResult.profile = profile;

      // 3. Test RLS debug function with type assertion
      const { data: debugRLS, error: debugRLSError } = await supabase
        .rpc('debug_pendencias_permissions' as any, { 
          p_corretora_id: corretoraId || profile.id 
        });
      
      debugResult.debugRLS = { data: debugRLS, error: debugRLSError };

      // 4. Test insert permission (without actually inserting)
      const testPendencia = {
        protocolo: `TEST-${Date.now()}`,
        tipo: 'ativacao',
        descricao: 'Test pendencia for RLS debugging',
        funcionario_id: '00000000-0000-0000-0000-000000000000', // Fake UUID for test
        cnpj_id: '00000000-0000-0000-0000-000000000000', // Fake UUID for test
        corretora_id: corretoraId || profile.id,
        status: 'pendente',
        data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      // Just test SELECT to see if we can read
      const { data: testSelect, error: testSelectError } = await supabase
        .from('pendencias')
        .select('id')
        .limit(1);

      debugResult.testInsert = { 
        testPendencia, 
        selectTest: { data: testSelect, error: testSelectError } 
      };

      setResult(debugResult);
    } catch (error) {
      setResult({
        currentUser: null,
        profile: null,
        debugRLS: null,
        testInsert: null,
        error: String(error)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Pendências RLS Debug</CardTitle>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="corretoraId">Corretora ID (opcional)</Label>
            <Input
              id="corretoraId"
              value={corretoraId}
              onChange={(e) => setCorretoraId(e.target.value)}
              placeholder="UUID da corretora para testar"
            />
          </div>
          <Button onClick={runDebug} disabled={isLoading}>
            {isLoading ? 'Debugando...' : 'Debug RLS'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="space-y-6">
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <h3 className="font-semibold text-red-800">Erro</h3>
                <p className="text-red-600">{result.error}</p>
              </div>
            )}

            {result.currentUser && (
              <div>
                <h3 className="font-semibold mb-2">Current User</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.currentUser, null, 2)}
                </pre>
              </div>
            )}

            {result.profile && (
              <div>
                <h3 className="font-semibold mb-2">Profile</h3>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.profile, null, 2)}
                </pre>
              </div>
            )}

            {result.debugRLS && (
              <div>
                <h3 className="font-semibold mb-2">RLS Debug Function Result</h3>
                <pre className="bg-blue-50 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.debugRLS, null, 2)}
                </pre>
              </div>
            )}

            {result.testInsert && (
              <div>
                <h3 className="font-semibold mb-2">Permission Test</h3>
                <pre className="bg-green-50 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(result.testInsert, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
