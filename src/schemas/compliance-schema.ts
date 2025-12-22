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

// New schema for RDO entries, replacing the old LivroObraRdo
export const rdoEntrySchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  budget_id: z.string().uuid().optional().nullable(),
  chapter_id: z.string().uuid().optional().nullable(),
  budget_item_id: z.string().uuid().optional().nullable(),
  date: z.string(), // Stored as 'YYYY-MM-DD'
  responsible_user_id: z.string().uuid().optional().nullable(),
  event_type: z.string(), // e.g., 'budget_item_update', 'task_completion', 'budget_approved', 'manual_entry'
  description: z.string(),
  details: z.any().optional().nullable(), // JSONB field
  observations: z.string().optional().nullable(),
  attachments_url: z.array(z.string()).optional().nullable(),
  status: z.string().default('pending'), // e.g., 'pending', 'approved', 'rejected'
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type RdoEntry = z.infer<typeof rdoEntrySchema>;