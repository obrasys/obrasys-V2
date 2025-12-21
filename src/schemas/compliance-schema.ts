import { z } from "zod";

export const livroObraSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(), // Adicionado para RLS
  project_id: z.string().uuid().min(1, "Selecione uma obra."),
  periodo_inicio: z.string().min(1, "A data de início é obrigatória."),
  periodo_fim: z.string().min(1, "A data de fim é obrigatória."),
  estado: z.enum(["em_preparacao", "aprovado", "arquivado"], {
    required_error: "O estado é obrigatório.",
  }).default("em_preparacao"),
  observacoes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type LivroObra = z.infer<typeof livroObraSchema>;

export const livroObraRdoSchema = z.object({
  id: z.string().uuid(),
  livro_obra_id: z.string().uuid(),
  rdo_id: z.string().uuid(),
  data: z.string(),
  resumo: z.string().optional().nullable(),
  custos_diarios: z.number(),
  created_at: z.string().optional(),
});

export type LivroObraRdo = z.infer<typeof livroObraRdoSchema>;