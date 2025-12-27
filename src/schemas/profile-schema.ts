import { z } from "zod";

export const profileSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, "O primeiro nome é obrigatório."),
  last_name: z.string().min(1, "O último nome é obrigatório."),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url("URL de avatar inválido.").optional().nullable(),
  role: z.string().optional().nullable(), // Role will be read-only
  company_id: z.string().uuid().optional().nullable(), // Company ID will be read-only
  plan_type: z.enum(["trialing", "iniciante", "profissional", "empresa"]).default("trialing").optional(), // NEW: plan_type
  updated_at: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

export const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "O nome da empresa é obrigatório."),
  nif: z.string().optional().nullable(), // Alterado para nullable
  email: z.string().email("Formato de email inválido.").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo_url: z.string().url("URL do logótipo inválido.").optional().nullable(),
  company_type: z.enum(["Empresa", "Profissional independente", "Entidade pública"]).default("Empresa").optional(), // NEW: company_type
  stripe_customer_id: z.string().nullable().optional(), // NEW: stripe_customer_id
  created_at: z.string().optional(),
  updated_at: z.string().optional(), // Adicionado: updated_at
});

export type Company = z.infer<typeof companySchema>;