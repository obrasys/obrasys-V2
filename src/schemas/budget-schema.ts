import { z } from "zod";

export const budgetItemSchema = z.object({
  id: z.string().uuid(),
  capitulo: z.string().min(1, "O capítulo é obrigatório."),
  servico: z.string().min(1, "O serviço é obrigatório."),
  quantidade: z.coerce.number().min(0, "A quantidade deve ser um valor positivo."),
  unidade: z.string().min(1, "A unidade é obrigatória."),
  preco_unitario: z.coerce.number().min(0, "O preço unitário deve ser um valor positivo."),
  custo_planeado: z.coerce.number().min(0),
  custo_executado: z.coerce.number().min(0),
  desvio: z.coerce.number(), // Calculated field
  estado: z.enum(["Em andamento", "Concluído", "Atrasado"], {
    required_error: "O estado é obrigatório.",
  }),
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;