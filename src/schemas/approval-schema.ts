import { z } from "zod";

export const approvalSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  entity_type: z.enum(["budget", "budget_item", "rdo_entry", "schedule_task", "budget_revision"]), // Extendable
  entity_id: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected", "changes_requested"]).default("pending"),
  requested_by_user_id: z.string().uuid(),
  requested_at: z.string().optional(),
  description: z.string().min(1, "A descrição é obrigatória."),
  reason: z.string().optional().nullable(),
  attachments_url: z.array(z.string().url("URL de anexo inválido.")).optional().nullable(),
  decision_at: z.string().optional().nullable(),
  decision_by_user_id: z.string().uuid().optional().nullable(),
  comments: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Approval = z.infer<typeof approvalSchema>;

export const approvalHistorySchema = z.object({
  id: z.string().uuid().optional(),
  approval_id: z.string().uuid(),
  action_type: z.enum(["requested", "approved", "rejected", "changes_requested"]),
  action_by_user_id: z.string().uuid(),
  action_at: z.string().optional(),
  comments: z.string().optional().nullable(),
  old_status: z.string().optional().nullable(),
  new_status: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export type ApprovalHistory = z.infer<typeof approvalHistorySchema>;

// Extended types for UI display with joined data
export type ApprovalWithRelations = Approval & {
  projects?: { nome: string } | null;
  requested_by_user?: { first_name: string; last_name: string; avatar_url: string | null } | null;
  decision_by_user?: { first_name: string; last_name: string; avatar_url: string | null } | null;
};

export type ApprovalHistoryWithUser = ApprovalHistory & {
  action_by_user?: { first_name: string; last_name: string; avatar_url: string | null } | null;
};