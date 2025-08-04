
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';

const recoverySchema = z.object({
  email: z.string().email('Email inválido'),
});

type RecoveryFormData = z.infer<typeof recoverySchema>;

interface PasswordRecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<RecoveryFormData>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: RecoveryFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
    } catch (error: any) {
      console.error('Recovery error:', error);
      toast({
        title: 'Erro ao enviar email',
        description: error.message || 'Tente novamente em alguns instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recuperar Senha
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? 'Enviamos um link de recuperação para seu email.'
              : 'Digite seu email para receber as instruções de recuperação.'
            }
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">
                Se o email estiver cadastrado, você receberá as instruções em breve.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
