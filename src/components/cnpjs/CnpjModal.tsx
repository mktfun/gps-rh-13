
import React, { useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Database } from '@/integrations/supabase/types';

type Cnpj = Database['public']['Tables']['cnpjs']['Row'];

const cnpjSchema = z.object({
  cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
  razao_social: z.string().min(2, 'Razão social deve ter pelo menos 2 caracteres'),
  status: z.enum(['configuracao', 'ativo', 'suspenso']),
});

type CnpjFormData = z.infer<typeof cnpjSchema>;

interface CnpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Cnpj | null;
  empresaId: string;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

const CnpjModal: React.FC<CnpjModalProps> = ({
  isOpen,
  onClose,
  initialData,
  empresaId,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!initialData;

  const form = useForm<CnpjFormData>({
    resolver: zodResolver(cnpjSchema),
    defaultValues: {
      cnpj: '',
      razao_social: '',
      status: 'configuracao',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        cnpj: initialData.cnpj,
        razao_social: initialData.razao_social,
        status: initialData.status as any,
      });
    } else {
      form.reset({
        cnpj: '',
        razao_social: '',
        status: 'configuracao',
      });
    }
  }, [initialData, form]);

  const handleSubmit = (data: CnpjFormData) => {
    const cnpjData = {
      ...data,
      cnpj: data.cnpj.replace(/\D/g, ''), // Remove formatação
      empresa_id: empresaId,
      ...(isEdit && { id: initialData!.id }),
    };

    onSubmit(cnpjData);
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar CNPJ' : 'Novo CNPJ'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00.000.000/0000-00"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCNPJ(e.target.value);
                        field.onChange(formatted.replace(/\D/g, ''));
                      }}
                      value={formatCNPJ(field.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="razao_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite a razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="configuracao">Em Configuração</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CnpjModal;
