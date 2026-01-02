import { z } from "zod";

/**
 * ======================================================
 * SUBSCRIPTIONS (tabela subscriptions)
 * ======================================================
 */
export const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),

  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),

  /**
   * Status real da subscrição
   * (Stripe + lógica interna)
   */
  status: z.enum([
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "incomplete",
    "canceled",
    "incomplete_expired",
  ]),

  /**
   * Plano contratado
   * (não confundir com status)
   */
  plan_type: z.enum([
    "free",
    "iniciante",
    "profissional",
    "empresa",
  ]),

  trial_start: z.string().datetime().optional(),
  trial_end: z.string().datetime().nullable().optional(),
  current_period_end: z.string().datetime().nullable().optional(),

  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;

/**
 * ======================================================
 * PAYMENTS (tabela subscription_payments)
 * ======================================================
 */
export const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  subscription_id: z.string().uuid(),

  amount: z.coerce.number().min(0.01),
  currency: z.string().default("eur"),

  status: z.enum(["pending", "succeeded", "failed"]),

  stripe_invoice_id: z.string().nullable().optional(),
  paid_at: z.string().datetime().nullable().optional(),

  created_at: z.string().datetime().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;

/**
 * ======================================================
 * COMPANY SUBSCRIPTION STATUS (VIEW)
 * Fonte única da verdade para o frontend
 * ======================================================
 */
export const companySubscriptionStatusSchema = z.object({
  company_id: z.string().uuid(),

  stripe_customer_id: z.string().nullable(),
  subscription_id: z.string().uuid().nullable(),

  /**
   * Plano atual da empresa
   */
  subscription_plan: z.enum([
    "free",
    "iniciante",
    "profissional",
    "empresa",
  ]),

  /**
   * Status bruto da subscrição
   */
  subscription_status: z.enum([
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "incomplete",
    "canceled",
    "incomplete_expired",
  ]),

  trial_end: z.string().datetime().nullable(),
  current_period_end: z.string().datetime().nullable(),

  /**
   * Estado COMPUTADO (usar no frontend)
   */
  computed_status: z.enum([
    "trialing",
    "active",
    "attention",
    "expired",
    "free",
  ]),
});

export type CompanySubscriptionStatus = z.infer<
  typeof companySubscriptionStatusSchema
>;
