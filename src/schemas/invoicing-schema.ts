import { z } from "zod";

/* =========================
   HELPERS
========================= */

// aceita "12,50" e "12.50"
const moneyNumber = z.preprocess((val) => {
  if (typeof val === "string") {
    const cleaned = val.replace(/\s/g, "").replace(",", ".");
    if (cleaned === "") return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : val;
  }
  return val;
}, z.number());

const percentNumber = z.preprocess((val) => {
  if (typeof val === "string") {
    const cleaned = val.replace(/\s/g, "").replace(",", ".");
    if (cleaned === "") return undefined;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : val;
  }
  return val;
}, z.number());

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido. Use YYYY-MM-DD.");

/* ======================================================
   INVOICE ITEMS
====================================================== */

export const invoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),

  description: z.string().trim().min(1, "A descrição é obrigatória."),

  quantity: moneyNumber
    .min(0.01, "A quantidade deve ser positiva."),

  unit: z.string().trim().min(1, "A unidade é obrigatória."),

  unit_price: moneyNumber
    .min(0, "O preço unitário não pode ser negativo."),

  // se quiseres desconto por linha, mete já aqui (opcional)
  // discount_rate: percentNumber.min(0).max(100).default(0),

  // calculado
  line_total: moneyNumber.min(0).optional(),

  budget_item_id: z.string().uuid().nullable().optional(),
  schedule_task_id: z.string().uuid().nullable().optional(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).superRefine((item, ctx) => {
  // coerência mínima do line_total se vier preenchido
  if (typeof item.line_total === "number") {
    const expected = item.quantity * item.unit_price;
    const diff = Math.abs(expected - item.line_total);
    // tolerância 1 cêntimo
    if (diff > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["line_total"],
        message: "O total da linha não corresponde a quantidade × preço unitário.",
      });
    }
  }
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

/* ======================================================
   INVOICE (FATURA)
====================================================== */

export const invoiceSchema = z.object({
  id: z.string().uuid().optional(),

  // no modelo de persistência eu recomendo obrigatório:
  company_id: z.string().uuid().optional(),

  project_id: z.string().uuid().nullable().optional(),

  client_id: z.string().uuid().min(1, "O cliente é obrigatório."),

  invoice_number: z.string().trim().min(1, "O número da fatura é obrigatório."),

  issue_date: isoDate,
  due_date: isoDate,

  currency: z.enum(["EUR"]).default("EUR"),

  notes: z.string().optional().nullable(),

  // items deveriam ser parte do “FullInvoiceFormValues”
  // mas podes validar aqui se estiverem presentes:
  items: z.array(invoiceItemSchema).min(1, "Adicione pelo menos 1 item.").optional(),

  /* ===== BASE (subtotal sem IVA) ===== */
  total_amount: moneyNumber.min(0).default(0),

  /* ===== IVA ===== */
  vat_rate: percentNumber.min(0).max(100).default(23),
  vat_amount: moneyNumber.min(0).default(0),

  /* ===== RETENÇÃO ===== */
  withholding_rate: percentNumber.min(0).max(100).default(0),
  withholding_amount: moneyNumber.min(0).default(0),

  /* ===== TOTAIS ===== */
  total_to_receive: moneyNumber.min(0).default(0),
  paid_amount: moneyNumber.min(0).default(0),

  status: z.enum([
    "draft",
    "sent",
    "pending",
    "partially_paid",
    "paid",
    "overdue",
    "cancelled",
  ]).default("draft"),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
}).superRefine((inv, ctx) => {
  // due_date >= issue_date (string YYYY-MM-DD permite comparar lexicograficamente)
  if (inv.due_date < inv.issue_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["due_date"],
      message: "A data de vencimento não pode ser anterior à data de emissão.",
    });
  }

  // coerência dos totais (se vierem preenchidos)
  const expectedVat = (inv.total_amount * inv.vat_rate) / 100;
  if (Math.abs(expectedVat - inv.vat_amount) > 0.02) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["vat_amount"],
      message: "O valor do IVA não corresponde ao subtotal × taxa de IVA.",
    });
  }

  const expectedWithholding = (inv.total_amount * inv.withholding_rate) / 100;
  if (Math.abs(expectedWithholding - inv.withholding_amount) > 0.02) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["withholding_amount"],
      message: "A retenção não corresponde ao subtotal × taxa de retenção.",
    });
  }

  const expectedTotalToReceive = inv.total_amount + inv.vat_amount - inv.withholding_amount;
  if (Math.abs(expectedTotalToReceive - inv.total_to_receive) > 0.02) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["total_to_receive"],
      message: "Total a receber incoerente com subtotal + IVA − retenção.",
    });
  }

  if (inv.paid_amount - inv.total_to_receive > 0.02) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paid_amount"],
      message: "O valor pago não pode exceder o total a receber.",
    });
  }
});

export type Invoice = z.infer<typeof invoiceSchema>;

/* ======================================================
   PAYMENTS
====================================================== */

export const paymentSchema = z.object({
  id: z.string().uuid().optional(),

  invoice_id: z.string().uuid().min(1, "O ID da fatura é obrigatório."),
  company_id: z.string().uuid().optional(),

  payment_date: isoDate,

  amount: moneyNumber.min(0.01, "O valor do pagamento deve ser positivo."),

  payment_method: z.enum(["bank_transfer", "cash", "card", "other"]).default("bank_transfer"),

  status: z.enum(["posted", "pending", "cancelled"]).default("posted"),

  notes: z.string().optional().nullable(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

/* ======================================================
   EXPENSES
====================================================== */

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),

  supplier_name: z.string().trim().min(1, "O nome do fornecedor é obrigatório."),
  description: z.string().trim().min(1, "A descrição da despesa é obrigatória."),

  amount: moneyNumber.min(0.01, "O valor da despesa deve ser positivo."),

  due_date: isoDate,

  currency: z.enum(["EUR"]).default("EUR"),

  status: z.enum(["pending", "paid", "overdue", "cancelled"]).default("pending"),

  notes: z.string().optional().nullable(),

  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Expense = z.infer<typeof expenseSchema>;
