import { z } from "zod";

export const projectSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, "O nome da obra é obrigatório."),
  cliente: z.string().min(1, "O cliente é obrigatório."),
  localizacao: z.string().min(1, "A localização é obrigatória."),
  estado: z.enum(["Em execução", "Concluída", "Suspensa", "Planeada"], {
    required_error: "O estado é obrigatório.",
  }),
  progresso: z.number().min(0).max(100),
  prazo: z.string(), // Pode ser uma data ou descrição
  custo_planeado: z.coerce.number().min(0),
  custo_real: z.coerce.number().min(0),
  budget_id: z.string().uuid().optional().nullable(), // Adicionado para ligar ao orçamento
});

export type Project = z.infer<typeof projectSchema>;

export const schedulePhaseSchema = z.object({
  id: z.string().uuid().optional(),
  schedule_id: z.string().uuid(),
  chapter_name: z.string().min(1, "O nome da fase é obrigatório."),
  start_date: z.string().optional().nullable(), // Usar string para datas para simplificar, pode ser Date
  end_date: z.string().optional().nullable(),
  duration_days: z.number().int().min(0).optional().nullable(),
  status: z.enum(["Planeado", "Em execução", "Concluído", "Atrasado"], {
    required_error: "O estado é obrigatório.",
  }).default("Planeado"),
  progress: z.number().min(0).max(100).default(0),
  order: z.number().int().min(0),
});

export type SchedulePhase = z.infer<typeof schedulePhaseSchema>;

export const scheduleSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  budget_id: z.string().uuid(),
  overall_progress: z.number().min(0).max(100).default(0),
  status: z.enum(["Planeado", "Em execução", "Concluído", "Atrasado"], {
    required_error: "O estado é obrigatório.",
  }).default("Planeado"),
});

export type Schedule = z.infer<typeof scheduleSchema>;