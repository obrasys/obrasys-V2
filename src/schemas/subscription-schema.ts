import { z } from "zod";

export const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
  status: z.enum(["trialing", "active", "expired", "suspended", "cancelled"]).default("trialing"),
  plan_type: z.enum(["trialing", "iniciante", "profissional", "empresa"]).default("trialing"),
  trial_start: z.string().datetime().optional(),
  trial_end: z.string().datetime().nullable().optional(),
  current_period_end: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

export const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  subscription_id: z.string().uuid(),
  amount: z.coerce.number().min(0.01, "O valor deve ser positivo."),
  currency: z.string().default("eur"),
  status: z.enum(["pending", "succeeded", "failed"]).default("pending"),
  stripe_invoice_id: z.string().nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;