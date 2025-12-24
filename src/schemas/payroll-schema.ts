import { z } from "zod";

export const payrollEntrySchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(), // Will be set by backend/hook
  project_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(), // Employee ID
  entry_date: z.string().min(1, "A data é obrigatória."),
  description: z.string().min(1, "A descrição é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor deve ser positivo."),
  type: z.enum(["salary", "bonus", "overtime", "tax", "benefit", "other"], {
    required_error: "O tipo é obrigatório.",
  }).default("salary"),
  status: z.enum(["pending", "processed", "paid"], {
    required_error: "O estado é obrigatório.",
  }).default("pending"),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PayrollEntry = z.infer<typeof payrollEntrySchema>;

// Extended type for UI display with joined data (e.g., project name, user name)
export type PayrollEntryWithRelations = PayrollEntry & {
  projects?: { nome: string } | null;
  users?: { first_name: string; last_name: string; } | null; // Assuming profiles table has first_name, last_name
};