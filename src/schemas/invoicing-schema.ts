import { z } from "zod";

export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  project_id: z.string().uuid().nullable().optional(),
  client_id: z.string().uuid().min(1, "O cliente é obrigatório."),
  invoice_number: z.string().min(1, "O número da fatura é obrigatório."),
  issue_date: z.string().min(1, "A data de emissão é obrigatória."),
  due_date: z.string().min(1, "A data de vencimento é obrigatória."),
  total_amount: z.coerce.number().min(0, "O valor total deve ser positivo.").default(0),
  paid_amount: z.coerce.number().min(0).default(0),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  description: z.string().min(1, "A descrição é obrigatória."),
  quantity: z.coerce.number().min(0.01, "A quantidade deve ser positiva."),
  unit: z.string().min(1, "A unidade é obrigatória."),
  unit_price: z.coerce.number().min(0.01, "O preço unitário deve ser positivo."),
  line_total: z.coerce.number().min(0).default(0),
  budget_item_id: z.string().uuid().nullable().optional(),
  schedule_task_id: z.string().uuid().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().min(1, "O ID da fatura é obrigatório."),
  company_id: z.string().uuid().optional(),
  payment_date: z.string().min(1, "A data do pagamento é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor do pagamento deve ser positivo."),
  payment_method: z.enum(["bank_transfer", "cash", "card", "other"]).default("bank_transfer"),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

// Extended types for UI display with joined data
export type InvoiceWithRelations = Invoice & {
  projects?: { nome: string } | null;
  clients?: { nome: string } | null;
  invoice_items?: InvoiceItem[];
  payments?: Payment[];
};

// NEW: Schema for Expenses
export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  supplier_name: z.string().min(1, "O nome do fornecedor é obrigatório."),
  description: z.string().min(1, "A descrição da despesa é obrigatória."),
  amount: z.coerce.number().min(0.01, "O valor da despesa deve ser positivo."),
  due_date: z.string().min(1, "A data de vencimento é obrigatória."),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;