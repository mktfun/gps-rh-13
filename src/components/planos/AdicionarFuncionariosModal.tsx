import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAllFuncionarios } from "@/hooks/useAllFuncionarios"
import { useAdicionarFuncionariosPlano } from "@/hooks/useAdicionarFuncionariosPlano"
import { useState } from "react"

const formSchema = z.object({
  funcionarios_ids: z.string().array().nonempty('Selecione ao menos um funcionário'),
})

interface AdicionarFuncionariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  planoId: string;
  onFuncionariosAdicionados?: () => void;
}

type AdicionarFuncionariosData = z.infer<typeof formSchema>

export default function AdicionarFuncionariosModal({
  isOpen,
  onClose,
  planoId,
  onFuncionariosAdicionados
}: AdicionarFuncionariosModalProps) {
  const { data: funcionarios, isLoading: isLoadingFuncionarios } = useAllFuncionarios();
  const [value, setValue] = useState<string[]>([]);

  const form = useForm<AdicionarFuncionariosData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      funcionarios_ids: [],
    },
  })

  const { mutateAsync, isLoading } = useAdicionarFuncionariosPlano();
  const { reset } = form;

  const onSubmit = async (data: AdicionarFuncionariosData) => {
    try {
      console.log('📤 Enviando dados:', data);
      
      await mutateAsync({
        plano_id: planoId,
        funcionarios_ids: data.funcionarios_ids,
        // Remove the tipoSeguro property that doesn't exist in the interface
      });
      
      onFuncionariosAdicionados?.();
      onClose();
      reset();
    } catch (error) {
      console.error('❌ Erro ao adicionar funcionários:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Funcionários</DialogTitle>
          <DialogDescription>
            Selecione os funcionários que você deseja adicionar a este plano.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="funcionarios_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Funcionários</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={true}
                          className={[
                            "w-full justify-between",
                            value.length > 0 ? "text-black" : "text-muted-foreground",
                          ].join(' ')}
                        >
                          {value.length > 0
                            ? `${value.length} funcionário(s) selecionados`
                            : "Selecione os funcionários..."}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <ScrollArea className="h-[200px]">
                        <Command>
                          <CommandList>
                            {funcionarios?.map((funcionario) => (
                              <CommandItem
                                key={funcionario.id}
                                value={funcionario.id}
                                onSelect={(currentValue) => {
                                  form.setValue(
                                    'funcionarios_ids',
                                    value.includes(funcionario.id)
                                      ? value.filter(
                                          (value) => value !== funcionario.id
                                        )
                                      : [...value, funcionario.id]
                                  );
                                  setValue(
                                    value.includes(funcionario.id)
                                      ? value.filter(
                                          (value) => value !== funcionario.id
                                        )
                                      : [...value, funcionario.id]
                                  );
                                }}
                              >
                                <Checkbox
                                  checked={value.includes(funcionario.id)}
                                  className="mr-2 h-4 w-4"
                                />
                                {funcionario.nome}
                              </CommandItem>
                            ))}
                            {!funcionarios?.length && (
                              <CommandEmpty>Nenhum funcionário encontrado.</CommandEmpty>
                            )}
                          </CommandList>
                        </Command>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Adicionando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
