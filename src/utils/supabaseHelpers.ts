import { supabase } from '@/integrations/supabase/client';

// Type-safe Supabase function calls
export const callSupabaseFunction = async <T>(
  functionName: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.rpc(functionName, params);
    
    if (error) {
      console.error(`Supabase RPC Error (${functionName}):`, error);
      return { 
        data: null, 
        error: `Erro na função ${functionName}: ${error.message}` 
      };
    }

    // Check if the function returned an error object
    if (data?.error) {
      console.error(`Function Error (${functionName}):`, data);
      return { 
        data: null, 
        error: `Erro interno: ${data.message} (${data.code})` 
      };
    }

    return { data, error: null };
  } catch (err) {
    console.error(`Unexpected error calling ${functionName}:`, err);
    return { 
      data: null, 
      error: 'Erro inesperado na comunicação com o servidor' 
    };
  }
};