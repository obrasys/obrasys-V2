import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, "O nome da obra é obrigatório."),
  client_id: z.string().uuid("Selecione um cliente válido.").optional().nullable(), // Alterado de 'cliente' para 'client_id'
  localizacao: z.string().min(1, "A localização é obrigatória."),
  estado: z.enum(["Em execução", "Concluída", "Suspensa", "Planeada", "Atrasada"], { // Adicionado "Atrasada"
    required_error: "O estado é obrigatório.",
  }),
  progresso: z.number().min(0).max(100),
  prazo: z.string(), // Pode ser uma data ou descrição
  custo_planeado: z.coerce.number().min(0),
  custo_real: z.coerce.number().min(0),
  budget_id: z.string().uuid().optional().nullable(), // Adicionado para ligar ao orçamento
  created_at: z.string().optional(), // NEW: Adicionado created_at
});

export type Project = z.infer<typeof projectSchema> & {
  client_name?: string; // Adicionado para exibir o nome do cliente, preenchido por join
};

// Renomeado de SchedulePhase para ScheduleTask e ajustado para corresponder à tabela public.schedule_tasks
export const scheduleTaskSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(), // Adicionado para corresponder à tabela
  schedule_id: z.string().uuid(),
  budget_item_id: z.string().uuid().optional().nullable(), // Adicionado para corresponder à tabela
  capitulo: z.string().min(1, "O capítulo é obrigatório."), // Renomeado de chapter_name
  ordem: z.number().int().min(0), // Renomeado de order
  data_inicio: z.string().optional().nullable(), // Renomeado de start_date
  data_fim: z.string().optional().nullable(), // Renomeado de end_date
  duracao_dias: z.number().int().min(0).optional().nullable(), // Renomeado de duration_days
  progresso: z.number().min(0).max(100).default(0), // Renomeado de progress
  estado: z.enum(["Planeado", "Em execução", "Concluído", "Atrasado"], { // Renomeado de status
    required_error: "O estado é obrigatório.",
  }).default("Planeado"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ScheduleTask = z.infer<typeof scheduleTaskSchema>;

export const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  budget_id: z.string().uuid(),
  overall_progress: z.number().min(0).max(100).default(0),
  status: z.enum(["Planeado", "Em execução", "Concluído", "Atrasado"], {
    required_error: "O estado é obrigatório.",
  }).default("Planeado"),
  company_id: z.string().uuid(), // Adicionado para corresponder à tabela
});

export type Schedule = z.infer<typeof scheduleSchema>;