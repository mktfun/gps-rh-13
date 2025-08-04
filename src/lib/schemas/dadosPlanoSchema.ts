
import { z } from 'zod';

export const dadosPlanoSchema = z.object({
  id: z.string().uuid().optional(),
  seguradora: z.string().min(3, "O nome da seguradora é obrigatório."),
  valor_mensal: z.number().positive("O valor mensal deve ser positivo."),
  cobertura_morte: z.number().min(0, "O valor não pode ser negativo."),
  cobertura_morte_acidental: z.number().min(0, "O valor não pode ser negativo."),
  cobertura_invalidez_acidente: z.number().min(0, "O valor não pode ser negativo."),
  cobertura_auxilio_funeral: z.number().min(0, "O valor não pode ser negativo."),
  tipo_seguro: z.enum(['vida', 'saude', 'outros']),
  cnpj_id: z.string().uuid({ message: "CNPJ inválido." })
});

export type DadosPlanoFormData = z.infer<typeof dadosPlanoSchema>;
