
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const useSettings = () => {
  const changePassword = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha. Tente novamente.');
    },
  });

  return {
    changePassword,
    isChangingPassword: changePassword.isPending,
  };
};
