import { z } from "zod";

export const profileSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, "O primeiro nome é obrigatório."),
  last_name: z.string().min(1, "O último nome é obrigatório."),
  phone: z.string().optional().nullable(),
  avatar_url: z.string().url("URL de avatar inválido.").optional().nullable(),
  role: z.string().optional().nullable(), // Role will be read-only
  company_id: z.string().uuid().optional().nullable(), // Company ID will be read-only
  updated_at: z.string().optional(),
});

export type Profile = z.infer<typeof profileSchema>;

export const companySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "O nome da empresa é obrigatório."),
  nif: z.string().optional().nullable(),
  email: z.string().email("Formato de email inválido.").optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logo_url: z.string().url("URL do logótipo inválido.").optional().nullable(),
  created_at: z.string().optional(),
});

export type Company = z.infer<typeof companySchema>;