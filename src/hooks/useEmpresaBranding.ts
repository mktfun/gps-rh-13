
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmpresaBrandingData {
  logo_url?: string;
}

interface EmpresaBrandingRow {
  logo_url: string | null;
}

export const useEmpresaBranding = () => {
  const queryClient = useQueryClient();

  const { data: branding, isLoading, error } = useQuery({
    queryKey: ['empresa-branding'],
    queryFn: async (): Promise<EmpresaBrandingRow | null> => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.empresa_id) return null;

      const { data, error } = await supabase
        .from('empresa_branding')
        .select('logo_url')
        .eq('empresa_id', profile.empresa_id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar branding da empresa:', error);
        throw error;
      }
      
      return data;
    },
  });

  const updateBranding = useMutation({
    mutationFn: async (brandingData: EmpresaBrandingData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.user.id)
        .single();

      if (!profile?.empresa_id) throw new Error('Empresa não encontrada');

      const { data, error } = await supabase
        .from('empresa_branding')
        .upsert({
          empresa_id: profile.empresa_id,
          logo_url: brandingData.logo_url,
        } as any, {
          onConflict: 'empresa_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidar e refetch imediato
      queryClient.invalidateQueries({ queryKey: ['empresa-branding'] });
      queryClient.refetchQueries({ queryKey: ['empresa-branding'] });
      
      // Forçar um refresh da autenticação para atualizar o branding no contexto
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('auth-branding-updated'));
      }, 100);
      
      toast.success('Logo da empresa atualizada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar logo da empresa:', error);
      toast.error('Erro ao atualizar logo da empresa');
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `logo-empresa-${user.user.id}-${timestamp}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('empresa-branding')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('empresa-branding')
        .getPublicUrl(fileName);

      // Adicionar cache busting timestamp à URL
      const logoUrlWithCacheBust = `${urlData.publicUrl}?v=${timestamp}`;

      return logoUrlWithCacheBust;
    },
    onSuccess: (logoUrl) => {
      updateBranding.mutate({ logo_url: logoUrl });
    },
    onError: (error) => {
      console.error('Erro ao fazer upload do logo:', error);
      toast.error('Erro ao fazer upload do logo');
    },
  });

  const deleteLogo = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      // Deletar arquivo do storage se existir
      if (branding?.logo_url) {
        try {
          // Extrair o nome do arquivo da URL
          const url = new URL(branding.logo_url);
          const fileName = url.pathname.split('/').pop()?.split('?')[0];
          
          if (fileName) {
            await supabase.storage
              .from('empresa-branding')
              .remove([fileName]);
          }
        } catch (error) {
          console.error('Erro ao extrair nome do arquivo:', error);
        }
      }

      // Atualizar registro no banco removendo a logo_url
      return updateBranding.mutateAsync({ logo_url: undefined });
    },
    onSuccess: () => {
      toast.success('Logo removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    },
  });

  // Criar uma função para obter a URL com cache bust
  const getLogoUrlWithCacheBust = () => {
    if (!branding?.logo_url) return null;
    
    // Se já tem timestamp na URL, usar como está
    if (branding.logo_url.includes('?v=')) {
      return branding.logo_url;
    }
    
    // Se não tem timestamp, adicionar um
    const separator = branding.logo_url.includes('?') ? '&' : '?';
    return `${branding.logo_url}${separator}v=${Date.now()}`;
  };

  return {
    branding: branding ? {
      ...branding,
      logo_url: getLogoUrlWithCacheBust()
    } : branding,
    isLoading,
    error,
    updateBranding,
    uploadLogo,
    deleteLogo,
    isUpdating: updateBranding.isPending || uploadLogo.isPending || deleteLogo.isPending,
  };
};
