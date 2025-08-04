
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Lock } from 'lucide-react';
import { BrandingSection } from '@/components/configuracoes/BrandingSection';
import { NotificacoesSection } from '@/components/configuracoes/NotificacoesSection';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

const ConfiguracoesPage = () => {
  const { changePassword, isChangingPassword } = useSettings();
  const { role } = useAuth();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: PasswordFormData) => {
    changePassword.mutate(
      { newPassword: data.newPassword },
      {
        onSuccess: () => {
          form.reset();
        },
      }
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="flex items-center space-x-2 text-2xl font-semibold">
            <Settings className="h-6 w-6" />
            <span>Configurações</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas preferências e configurações de segurança
          </p>
        </div>

        {/* Seção de Branding - apenas para corretoras */}
        {role === 'corretora' && (
          <div className="mb-6">
            <BrandingSection />
          </div>
        )}

        {/* Seção de Alteração de Senha */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Segurança</span>
            </CardTitle>
            <CardDescription>
              Altere sua senha para manter sua conta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Digite sua senha atual" 
                          {...field} 
                          disabled={isChangingPassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Digite sua nova senha" 
                          {...field} 
                          disabled={isChangingPassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Confirme sua nova senha" 
                          {...field} 
                          disabled={isChangingPassword}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto"
                >
                  {isChangingPassword ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Seção de Notificações */}
        <NotificacoesSection />
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
