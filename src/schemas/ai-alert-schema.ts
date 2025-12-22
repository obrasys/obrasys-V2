import { z } from "zod";

export const aiAlertSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid().nullable(),
  type: z.string().nullable(),
  severity: z.enum(["info", "warning", "critical"]).nullable(),
  title: z.string().nullable(),
  message: z.string().nullable(),
  created_at: z.string().optional(),
  resolved: z.boolean().default(false),
});

export type AiAlert = z.infer<typeof aiAlertSchema>;