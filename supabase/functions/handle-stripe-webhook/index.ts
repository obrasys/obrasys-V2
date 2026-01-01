import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.2.0?target=deno";

/**
 * Webhooks são server-to-server, CORS não é necessário para Stripe.
 * Mantemos headers mínimos para evitar problemas no dashboard.
 */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      return json(500, { error: "Stripe env vars missing" });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json(500, { error: "Supabase env vars missing" });
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return json(400, { error: "Missing stripe-signature" });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Invalid signature:", err);
      return json(400, { error: "Invalid signature" });
    }

    // ✅ Service role (webhook precisa bypass RLS)
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    /**
     * Helpers
     */
    const toISO = (unixSeconds: number | null | undefined) =>
      unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;

    const nowISO = () => new Date().toISOString();

    /**
     * ⚠️ Fonte de verdade:
     * - Billing/plan/status vivem em `subscriptions`
     * - NÃO mexer em `profiles` aqui
     */

    switch (event.type) {
      /**
       * ✅ Checkout finalizado:
       * - não forçar active (isso vem dos subscription events)
       * - criar/upsert para garantir ligação company_id + stripe ids + plan_type
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const companyId = session.metadata?.company_id ?? null;
        const planType = session.metadata?.plan_type ?? null;

        const stripeCustomerId = (session.customer as string) ?? null;
        const stripeSubscriptionId = (session.subscription as string) ?? null;

        if (!companyId || !planType || !stripeCustomerId || !stripeSubscriptionId) {
          console.warn("checkout.session.completed missing metadata/ids", {
            companyId,
            planType,
            stripeCustomerId,
            stripeSubscriptionId,
          });
          // Não falhar o webhook para não re-tentar infinitamente
          return json(200, { received: true, warning: "missing metadata/ids" });
        }

        // ✅ Upsert pelo stripe_subscription_id (canonical)
        const { error: upsertErr } = await supabaseAdmin
          .from("subscriptions")
          .upsert(
            {
              company_id: companyId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              plan_type: planType,
              // NÃO forçar active aqui (evita race)
              status: "trialing",
              current_period_end: null,
              trial_end: null,
              updated_at: nowISO(),
            },
            { onConflict: "stripe_subscription_id" }
          );

        if (upsertErr) {
          console.error("Upsert subscription failed:", upsertErr);
          return json(500, { error: "Failed to upsert subscription" });
        }

        // ✅ Registar pagamento (se existir amount_total)
        // Nota: checkout.session.completed pode não ter invoice em alguns cenários
        const amountTotal =
          typeof session.amount_total === "number"
            ? session.amount_total / 100
            : 0;

        // Encontrar subscription row id (PK) para gravar subscription_payments
        const { data: subscriptionRow, error: fetchSubErr } =
          await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", stripeSubscriptionId)
            .single();

        if (fetchSubErr) {
          console.error("Fetch subscription id failed:", fetchSubErr);
          // Não falhar tudo por causa do log de pagamento
          return json(200, { received: true, warning: "payment not recorded" });
        }

        // Inserir pagamento se tiver valor > 0
        if (amountTotal > 0) {
          const { error: payErr } = await supabaseAdmin
            .from("subscription_payments")
            .insert({
              company_id: companyId,
              subscription_id: subscriptionRow.id,
              amount: amountTotal,
              currency: session.currency || "eur",
              status: "succeeded",
              stripe_invoice_id: (session.invoice as string) ?? null,
              paid_at: nowISO(),
            });

          if (payErr) {
            console.error("Insert subscription_payments failed:", payErr);
            // não quebrar webhook
          }
        }

        break;
      }

      /**
       * ✅ Subscrição criada/atualizada:
       * Atualiza status real + datas (trial_end / current_period_end)
       */
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        const stripeSubscriptionId = sub.id;
        const stripeCustomerId = sub.customer as string;
        const status = sub.status; // trialing | active | past_due | canceled | incomplete_expired | etc.

        const currentPeriodEndISO = toISO(sub.current_period_end);
        const trialEndISO = toISO(sub.trial_end);

        // 🔎 Descobrir company_id pelo stripe_customer_id (via companies)
        // (assume companies.stripe_customer_id existe e é preenchido no onboarding)
        const { data: company, error: companyErr } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId)
          .single();

        if (companyErr || !company?.id) {
          console.error("Company not found for stripe_customer_id:", companyErr);
          // Se a empresa ainda não tem stripe_customer_id gravado, não falhar
          return json(200, { received: true, warning: "company not mapped yet" });
        }

        // ✅ Atualizar subscription por stripe_subscription_id (preferido)
        const { error: updateErr } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            current_period_end: currentPeriodEndISO,
            trial_end: trialEndISO,
            updated_at: nowISO(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        if (updateErr) {
          console.error("Update subscription failed:", updateErr);
          return json(500, { error: "Failed to update subscription" });
        }

        // ✅ Garantir stripe_customer_id gravado na subscription (se ainda não estiver)
        // (opcional, mas ajuda consistência)
        await supabaseAdmin
          .from("subscriptions")
          .update({
            company_id: company.id,
            stripe_customer_id: stripeCustomerId,
            updated_at: nowISO(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        break;
      }

      /**
       * ✅ Pagamento sucesso:
       * - registar payment
       * - atualizar status para active
       * - atualizar current_period_end com base na subscrição do Stripe
       */
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        const stripeCustomerId = invoice.customer as string;
        const stripeSubscriptionId = invoice.subscription as string;

        if (!stripeCustomerId || !stripeSubscriptionId) {
          return json(200, { received: true, warning: "missing ids" });
        }

        const { data: company, error: companyErr } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId)
          .single();

        if (companyErr || !company?.id) {
          console.error("Company not found for invoice:", companyErr);
          return json(200, { received: true, warning: "company not mapped yet" });
        }

        // Buscar subscription row
        const { data: subRow, error: subErr } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan_type")
          .eq("stripe_subscription_id", stripeSubscriptionId)
          .single();

        if (subErr || !subRow) {
          console.error("Subscription not found for invoice:", subErr);
          return json(200, { received: true, warning: "subscription not found" });
        }

        // Registar payment
        const amountPaid =
          typeof invoice.amount_paid === "number"
            ? invoice.amount_paid / 100
            : 0;

        await supabaseAdmin.from("subscription_payments").insert({
          company_id: company.id,
          subscription_id: subRow.id,
          amount: amountPaid,
          currency: invoice.currency || "eur",
          status: "succeeded",
          stripe_invoice_id: invoice.id,
          paid_at: nowISO(),
        });

        // Buscar subscrição no Stripe para period_end
        let stripeSub: Stripe.Subscription | null = null;
        try {
          stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        } catch (e) {
          console.error("Failed to retrieve stripe subscription:", e);
        }

        const periodEndISO = stripeSub?.current_period_end
          ? new Date(stripeSub.current_period_end * 1000).toISOString()
          : null;

        // Atualizar subscription
        const { error: updateErr } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            plan_type: subRow.plan_type,
            current_period_end: periodEndISO,
            updated_at: nowISO(),
          })
          .eq("stripe_subscription_id", stripeSubscriptionId);

        if (updateErr) {
          console.error("Update subscription after payment_succeeded failed:", updateErr);
          return json(500, { error: "Failed to update subscription after payment" });
        }

        break;
      }

      /**
       * ✅ Pagamento falhou:
       * - registar failed payment
       * - marcar status past_due (não suspended)
       */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        const stripeCustomerId = invoice.customer as string;
        const stripeSubscriptionId = invoice.subscription as string;

        if (!stripeCustomerId) {
          return json(200, { received: true, warning: "missing customer id" });
        }

        const { data: company, error: companyErr } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("stripe_customer_id", stripeCustomerId)
          .single();

        if (companyErr || !company?.id) {
          console.error("Company not found for payment_failed:", companyErr);
          return json(200, { received: true, warning: "company not mapped yet" });
        }

        // Buscar subscription row
        let subRow: { id: string } | null = null;
        if (stripeSubscriptionId) {
          const { data, error } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", stripeSubscriptionId)
            .single();
          if (!error && data) subRow = data as any;
        }

        // Registar falha (se tiver subscription)
        const amountDue =
          typeof invoice.amount_due === "number" ? invoice.amount_due / 100 : 0;

        if (subRow?.id) {
          await supabaseAdmin.from("subscription_payments").insert({
            company_id: company.id,
            subscription_id: subRow.id,
            amount: amountDue,
            currency: invoice.currency || "eur",
            status: "failed",
            stripe_invoice_id: invoice.id,
            paid_at: null,
          });
        }

        // Atualizar status para past_due (não suspended)
        if (stripeSubscriptionId) {
          const { error: updateErr } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: nowISO(),
            })
            .eq("stripe_subscription_id", stripeSubscriptionId);

          if (updateErr) {
            console.error("Update subscription to past_due failed:", updateErr);
            // não quebrar webhook
          }
        }

        break;
      }

      default: {
        console.warn(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    return json(200, { received: true });
  } catch (err) {
    console.error("Webhook internal error:", err);
    return json(500, { error: "Internal error" });
  }
});
