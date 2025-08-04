
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/useProfile';
import { EmpresaLogoSection } from '@/components/perfil/EmpresaLogoSection';
import { User } from 'lucide-react';

const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const PerfilPage = () => {
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      nome: profile?.nome || '',
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Seção de informações do perfil */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Meu Perfil</span>
          </CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite seu nome" 
                        {...field} 
                        disabled={isUpdating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input 
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
                <p className="text-sm text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Input 
                  id="role"
                  value={profile?.role === 'corretora' ? 'Corretora' : profile?.role === 'empresa' ? 'Empresa' : profile?.role === 'admin' ? 'Administrador' : profile?.role || ''}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Seção de logo da empresa - só aparece para empresas */}
      <div className="max-w-2xl mx-auto">
        <EmpresaLogoSection />
      </div>
    </div>
  );
};

export default PerfilPage;
