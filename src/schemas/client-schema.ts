import { z } from "zod";

export const clientSchema = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().min(1, "O nome é obrigatório."),
  nif: z.string().min(9, "O NIF deve ter 9 dígitos.").max(9, "O NIF deve ter 9 dígitos.").nullable().optional(), // Alterado para nullable().optional()
  email: z.string().email("Formato de email inválido.").min(1, "O email é obrigatório."),
  telefone: z.string().min(1, "O telefone é obrigatório."),
  empresa: z.string().optional(),
  endereco: z.string().min(1, "O endereço é obrigatório."),
  observacoes: z.string().optional(),
});

export type Client = z.infer<typeof clientSchema>;