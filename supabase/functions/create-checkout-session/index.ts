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
    const { company_id, plan_type, customer_email } = await req.json();

    if (!company_id || !plan_type || !customer_email) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: company_id, plan_type, customer_email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get Supabase client with service role key for backend operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Check if Stripe Customer exists for the company
    let stripeCustomerId: string | null = null;
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', company_id)
      .single();

    if (companyError && companyError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching company stripe_customer_id:', companyError);
      throw new Error('Failed to fetch company data.');
    }

    if (companyData?.stripe_customer_id) {
      stripeCustomerId = companyData.stripe_customer_id;
    } else {
      // Create new Stripe Customer
      const customer = await stripe.customers.create({
        email: customer_email,
        metadata: { supabase_company_id: company_id },
      });
      stripeCustomerId = customer.id;

      // Update company with new Stripe Customer ID
      const { error: updateCompanyError } = await supabaseAdmin
        .from('companies')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', company_id);

      if (updateCompanyError) {
        console.error('Error updating company with stripe_customer_id:', updateCompanyError);
        throw new Error('Failed to update company with Stripe customer ID.');
      }
    }

    // Determine Stripe Price ID based on plan_type
    let priceId: string;
    switch (plan_type) {
      case 'iniciante':
        priceId = Deno.env.get('STRIPE_PRICE_ID_INICIANTE') as string;
        break;
      case 'profissional':
        priceId = Deno.env.get('STRIPE_PRICE_ID_PROFISSIONAL') as string;
        break;
      case 'empresa':
        // For 'empresa' plan, it's "Contactar Vendas", so no direct checkout
        return new Response(JSON.stringify({ error: 'Please contact sales for the Enterprise plan.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      default:
        return new Response(JSON.stringify({ error: 'Invalid plan_type provided.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!priceId) {
      return new Response(JSON.stringify({ error: `Stripe Price ID for ${plan_type} is not configured.` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${Deno.env.get('FRONTEND_URL')}/dashboard?success=true`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/plans?cancelled=true`,
      metadata: {
        company_id: company_id,
        plan_type: plan_type,
      },
      subscription_data: {
        trial_from_plan: true, // Use trial period defined in Stripe Price object
      },
    });

    return new Response(JSON.stringify({ url: checkoutSession.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stripe Checkout Session Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});