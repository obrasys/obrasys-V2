import { z } from "zod";

export const aiAlertSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(), // Adicionado: ID da empresa
  project_id: z.string().uuid().nullable(),
  project_name: z.string().optional(), // Adicionado: Nome do projeto para exibição
  type: z.string().nullable(),
  severity: z.enum(["info", "warning", "critical"]).nullable(),
  title: z.string().nullable(),
  message: z.string().nullable(),
  created_at: z.string().optional(),
  resolved: z.boolean().default(false),
});

export type AiAlert = z.infer<typeof aiAlertSchema>;