
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(1, 'Telefone é obrigatório'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresa?: Empresa | null;
  onSave: (data: EmpresaFormData) => void;
  isLoading?: boolean;
}

const EmpresaModal: React.FC<EmpresaModalProps> = ({
  isOpen,
  onClose,
  empresa,
  onSave,
  isLoading = false
}) => {
  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nome: empresa?.nome || '',
      email: empresa?.email || '',
      telefone: empresa?.telefone || '',
      responsavel: empresa?.responsavel || '',
    },
  });

  React.useEffect(() => {
    if (empresa) {
      form.reset({
        nome: empresa.nome,
        email: empresa.email,
        telefone: empresa.telefone,
        responsavel: empresa.responsavel,
      });
    } else {
      form.reset({
        nome: '',
        email: '',
        telefone: '',
        responsavel: '',
      });
    }
  }, [empresa, form]);

  const handleSubmit = (data: EmpresaFormData) => {
    onSave(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {empresa ? 'Editar Empresa' : 'Nova Empresa'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Digite o nome da empresa" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@empresa.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(11) 99999-9999" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome do responsável" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EmpresaModal;
