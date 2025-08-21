import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function DashboardDataTest() {
  const { user, empresaId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const realEmpresaId = empresaId || user?.empresa_id || user?.id;

  const testFunction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 [TEST] Testing with empresaId:', realEmpresaId);
      
      // Test 1: Direct RPC call
      const { data, error: rpcError } = await supabase
        .rpc('get_empresa_dashboard_metrics', {
          p_empresa_id: realEmpresaId
        });

      if (rpcError) {
        throw new Error(`RPC Error: ${rpcError.message}`);
      }

      console.log('🧪 [TEST] Raw result:', data);
      setResult(data);

    } catch (err: any) {
      console.error('🧪 [TEST] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, empresa_id')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setResult({
        connection: 'OK',
        profile: data,
        authUser: {
          id: user?.id,
          email: user?.email,
          role: user?.user_metadata?.role
        },
        authContext: {
          empresaId,
          userEmpresaId: user?.empresa_id,
          realEmpresaId
        }
      });

    } catch (err: any) {
      console.error('🧪 [CONNECTION TEST] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testOtherFunctions = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test if functions exist
      const tests: any = {};

      // Test function without parameters
      try {
        const { data: v3Data, error: v3Error } = await supabase
          .rpc('get_empresa_dashboard_metrics_v3');
        tests.v3 = { data: v3Data, error: v3Error };
      } catch (err) {
        tests.v3 = { error: err };
      }

      // Test function with wrong parameter
      try {
        const { data: wrongData, error: wrongError } = await supabase
          .rpc('get_empresa_dashboard_metrics');
        tests.noParams = { data: wrongData, error: wrongError };
      } catch (err) {
        tests.noParams = { error: err };
      }

      setResult(tests);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 Dashboard Data Test</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline">User ID: {user?.id?.slice(0, 8)}...</Badge>
          <Badge variant="outline">Empresa ID: {realEmpresaId?.slice(0, 8)}...</Badge>
          <Badge variant="outline">Role: {user?.user_metadata?.role}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            variant="outline"
          >
            Test Connection
          </Button>
          <Button 
            onClick={testFunction} 
            disabled={loading}
            variant="default"
          >
            Test Dashboard Function
          </Button>
          <Button 
            onClick={testOtherFunctions} 
            disabled={loading}
            variant="secondary"
          >
            Test Other Functions
          </Button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Testing...</p>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <h4 className="font-semibold text-destructive mb-2">Error:</h4>
            <p className="text-sm text-destructive/80">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <h4 className="font-semibold">Result:</h4>
            <Textarea
              value={JSON.stringify(result, null, 2)}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4 text-sm">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>User ID: {user?.id}</li>
            <li>Empresa ID (context): {empresaId}</li>
            <li>Empresa ID (user): {user?.empresa_id}</li>
            <li>Real Empresa ID: {realEmpresaId}</li>
            <li>Email: {user?.email}</li>
            <li>Role (metadata): {user?.user_metadata?.role}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
