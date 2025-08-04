
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BrandingData {
  logo_url?: string;
  cor_primaria?: string;
}

interface BrandingRow {
  logo_url: string | null;
  cor_primaria: string | null;
}

export const useBranding = () => {
  const queryClient = useQueryClient();

  const { data: branding, isLoading, error } = useQuery({
    queryKey: ['branding'],
    queryFn: async (): Promise<BrandingRow | null> => {
      const { data, error } = await supabase
        .from('corretora_branding')
        .select('logo_url, cor_primaria')
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar branding:', error);
        throw error;
      }
      
      return data;
    },
  });

  const updateBranding = useMutation({
    mutationFn: async (brandingData: BrandingData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('corretora_branding')
        .upsert({
          corretora_id: user.user.id,
          logo_url: brandingData.logo_url,
          cor_primaria: brandingData.cor_primaria,
        } as any, {
          onConflict: 'corretora_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Configurações de marca atualizadas com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar branding:', error);
      toast.error('Erro ao atualizar configurações de marca');
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${user.user.id}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('branding')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    },
    onSuccess: (logoUrl) => {
      updateBranding.mutate({ logo_url: logoUrl });
    },
    onError: (error) => {
      console.error('Erro ao fazer upload do logo:', error);
      toast.error('Erro ao fazer upload do logo');
    },
  });

  return {
    branding,
    isLoading,
    error,
    updateBranding,
    uploadLogo,
    isUpdating: updateBranding.isPending || uploadLogo.isPending,
  };
};
