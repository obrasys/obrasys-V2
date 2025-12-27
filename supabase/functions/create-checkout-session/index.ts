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

    // NOVO: validar secrets/variáveis necessárias antes de qualquer chamada externa
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL');

    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'Missing secret STRIPE_SECRET_KEY in Supabase → Edge Functions → Manage Secrets.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function environment.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!frontendUrl) {
      return new Response(JSON.stringify({ error: 'Missing FRONTEND_URL secret. Set it to your app domain, e.g., https://app.obrasys.pt' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecret as string, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get Supabase client with service role key for backend operations
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseServiceRoleKey ?? ''
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
      return new Response(JSON.stringify({ error: 'Failed to fetch company data (companies table not accessible with service role).' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
        return new Response(JSON.stringify({ error: 'Failed to update company with Stripe customer ID (check RLS/policies).' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Determine Stripe Price ID based on plan_type
    let priceId: string | undefined;
    switch (plan_type) {
      case 'iniciante':
        priceId = Deno.env.get('STRIPE_PRICE_ID_INICIANTE') as string | undefined;
        break;
      case 'profissional':
        priceId = Deno.env.get('STRIPE_PRICE_ID_PROFISSIONAL') as string | undefined;
        break;
      case 'empresa':
        // For 'empresa' plan, it's "Contactar Vendas", so no direct checkout
        return new Response(JSON.stringify({ error: 'Please contact sales for the Enterprise plan.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      default:
        return new Response(JSON.stringify({ error: `Invalid plan_type provided: ${plan_type}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!priceId) {
      return new Response(JSON.stringify({ error: `Stripe Price ID for plan '${plan_type}' is not configured in Supabase secrets.` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId!,
      mode: 'subscription',
      line_items: [{
        price: priceId!,
        quantity: 1,
      }],
      success_url: `${frontendUrl}/dashboard?success=true`,
      cancel_url: `${frontendUrl}/plans?cancelled=true`,
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
    // NOVO: devolver mensagem mais clara
    const message = (error && (error as any).message) ? (error as any).message : 'Unknown error creating checkout session.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});