import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Stripe-Signature header or webhook secret missing.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let companyId: string | null = null;
    let stripeCustomerId: string | null = null;
    let stripeSubscriptionId: string | null = null;
    let planType: string | null = null;
    let subscriptionStatus: string | null = null;
    let currentPeriodEnd: number | null = null;
    let trialEnd: number | null = null;

    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        companyId = checkoutSession.metadata?.company_id || null;
        stripeCustomerId = checkoutSession.customer as string;
        stripeSubscriptionId = checkoutSession.subscription as string;
        planType = checkoutSession.metadata?.plan_type || null;
        subscriptionStatus = 'active';

        // Update or create subscription in Supabase
        if (companyId && stripeCustomerId && stripeSubscriptionId && planType) {
          const { error } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              company_id: companyId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              status: subscriptionStatus,
              plan_type: planType,
              current_period_end: null,  // Set later via subscription events
              trial_end: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'company_id' });

          if (error) {
            console.error('Error upserting subscription on checkout.session.completed:', error);
            throw new Error('Failed to update subscription.');
          }

          // Update profile plan_type
          const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ plan_type: planType })
            .eq('company_id', companyId);

          if (profileUpdateError) {
            console.error('Error updating profile plan_type on checkout.session.completed:', profileUpdateError);
            throw new Error('Failed to update profile plan_type.');
          }

          // Record subscription payment (Stripe checkout)
          const { data: subscriptionRow, error: subscriptionFetchErr } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('company_id', companyId)
            .single();

          if (subscriptionFetchErr) {
            console.error('Error fetching subscription id:', subscriptionFetchErr);
            throw new Error('Failed to fetch subscription id.');
          }

          const amountTotal = checkoutSession.amount_total ? checkoutSession.amount_total / 100 : 0;

          const { error: subPaymentErr } = await supabaseAdmin
            .from('subscription_payments')
            .insert({
              company_id: companyId,
              subscription_id: subscriptionRow.id,
              amount: amountTotal,
              currency: checkoutSession.currency || 'eur',
              status: 'succeeded',
              stripe_invoice_id: checkoutSession.invoice as string,
              paid_at: new Date().toISOString(),
            });

          if (subPaymentErr) {
            console.error('Error inserting subscription payment on checkout.session.completed:', subPaymentErr);
            throw new Error('Failed to record subscription payment.');
          }
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        stripeSubscriptionId = subscription.id;
        stripeCustomerId = subscription.customer as string;
        subscriptionStatus = subscription.status;
        currentPeriodEnd = subscription.current_period_end;
        trialEnd = subscription.trial_end;

        // Fetch company_id from companies table using stripe_customer_id
        const { data: companyByStripe, error: companyByStripeError } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        if (companyByStripeError) {
          console.error('Error fetching company_id by stripe_customer_id:', companyByStripeError);
          throw new Error('Failed to find company for Stripe customer.');
        }
        companyId = companyByStripe.id;

        // Update subscription in Supabase
        if (companyId && stripeSubscriptionId) {
          const { data: existingSub, error: fetchSubError } = await supabaseAdmin
            .from('subscriptions')
            .select('plan_type')
            .eq('company_id', companyId)
            .single();

          if (fetchSubError) {
            console.error('Error fetching existing subscription:', fetchSubError);
            throw new Error('Failed to fetch existing subscription.');
          }
          planType = existingSub.plan_type; // Keep existing plan_type

          const { error } = await supabaseAdmin
            .from('subscriptions')
            .update({
              status: subscriptionStatus,
              current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
              trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('company_id', companyId);

          if (error) {
            console.error('Error updating subscription on customer.subscription.updated/deleted:', error);
            throw new Error('Failed to update subscription.');
          }

          // Update profile plan_type if status changes to cancelled/expired
          if (subscriptionStatus === 'canceled' || subscriptionStatus === 'incomplete_expired') {
            const { error: profileUpdateError } = await supabaseAdmin
              .from('profiles')
              .update({ plan_type: 'expired' }) // Or 'cancelled' if you have that enum
              .eq('company_id', companyId);

            if (profileUpdateError) {
              console.error('Error updating profile plan_type on subscription cancelled/expired:', profileUpdateError);
              throw new Error('Failed to update profile plan_type.');
            }
          }
        }
        break;

      case 'invoice.payment_succeeded':
        const invoiceSucceeded = event.data.object as Stripe.Invoice;
        stripeCustomerId = invoiceSucceeded.customer as string;
        stripeSubscriptionId = invoiceSucceeded.subscription as string;

        // Fetch company_id using stripe_customer_id
        const { data: companyForInvoice, error: companyForInvoiceError } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        if (companyForInvoiceError) {
          console.error('Error fetching company_id for invoice.payment_succeeded:', companyForInvoiceError);
          throw new Error('Failed to find company for Stripe customer.');
        }
        companyId = companyForInvoice.id;

        // Fetch subscription row (id and plan_type)
        const { data: subForInvoice, error: subForInvoiceError } = await supabaseAdmin
          .from('subscriptions')
          .select('id, plan_type')
          .eq('company_id', companyId)
          .single();

        if (subForInvoiceError) {
          console.error('Error fetching subscription_id for invoice.payment_succeeded:', subForInvoiceError);
          throw new Error('Failed to find subscription for company.');
        }

        // Record subscription payment
        const { error: paymentSucceededError } = await supabaseAdmin
          .from('subscription_payments')
          .insert({
            company_id: companyId,
            subscription_id: subForInvoice.id,
            amount: invoiceSucceeded.amount_paid ? invoiceSucceeded.amount_paid / 100 : 0,
            currency: invoiceSucceeded.currency || 'eur',
            status: 'succeeded',
            stripe_invoice_id: invoiceSucceeded.id,
            paid_at: new Date().toISOString(),
          });

        if (paymentSucceededError) {
          console.error('Error inserting payment on invoice.payment_succeeded:', paymentSucceededError);
          throw new Error('Failed to record payment.');
        }

        // Retrieve Stripe subscription to get current_period_end
        let stripeSub: Stripe.Subscription | null = null;
        if (stripeSubscriptionId) {
          stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        }

        const newPeriodEndISO = stripeSub?.current_period_end
          ? new Date(stripeSub.current_period_end * 1000).toISOString()
          : null;

        // Update subscription status and keep plan_type
        const { error: updateSubError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'active',
            plan_type: subForInvoice.plan_type,
            current_period_end: newPeriodEndISO,
            updated_at: new Date().toISOString(),
          })
          .eq('company_id', companyId);

        if (updateSubError) {
          console.error('Error updating subscription status and period end:', updateSubError);
          throw new Error('Failed to update subscription.');
        }
        break;

      case 'invoice.payment_failed':
        const invoiceFailed = event.data.object as Stripe.Invoice;
        stripeCustomerId = invoiceFailed.customer as string;

        // Fetch company_id using stripe_customer_id
        const { data: companyForFailedInvoice, error: companyForFailedInvoiceError } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        if (companyForFailedInvoiceError) {
          console.error('Error fetching company_id for invoice.payment_failed:', companyForFailedInvoiceError);
          throw new Error('Failed to find company for Stripe customer.');
        }
        companyId = companyForFailedInvoice.id;

        // Fetch subscription row
        const { data: subForFailedInvoice, error: subForFailedInvoiceError } = await supabaseAdmin
          .from('subscriptions')
          .select('id')
          .eq('company_id', companyId)
          .single();

        if (subForFailedInvoiceError) {
          console.error('Error fetching subscription_id for invoice.payment_failed:', subForFailedInvoiceError);
          throw new Error('Failed to find subscription for company.');
        }

        // Record failed payment
        const { error: paymentFailedError } = await supabaseAdmin
          .from('subscription_payments')
          .insert({
            company_id: companyId,
            subscription_id: subForFailedInvoice.id,
            amount: invoiceFailed.amount_due ? invoiceFailed.amount_due / 100 : 0,
            currency: invoiceFailed.currency || 'eur',
            status: 'failed',
            stripe_invoice_id: invoiceFailed.id,
            paid_at: null,
          });

        if (paymentFailedError) {
          console.error('Error inserting payment on invoice.payment_failed:', paymentFailedError);
          throw new Error('Failed to record failed payment.');
        }

        // Update subscription status to suspended/past_due
        const { error: updateSubStatusError } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('company_id', companyId);

        if (updateSubStatusError) {
          console.error('Error updating subscription status to suspended:', updateSubStatusError);
          throw new Error('Failed to update subscription status.');
        }

        // Update profile plan_type to expired
        const { error: profileUpdateError2 } = await supabaseAdmin
          .from('profiles')
          .update({ plan_type: 'expired' })
          .eq('company_id', companyId);

        if (profileUpdateError2) {
          console.error('Error updating profile plan_type on invoice.payment_failed:', profileUpdateError2);
          throw new Error('Failed to update profile plan_type.');
        }
        break;

      default:
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Stripe Webhook Handler Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});