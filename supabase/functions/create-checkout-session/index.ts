import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@16.2.0?target=deno';

const FRONTEND_ORIGIN = Deno.env.get('FRONTEND_URL') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': FRONTEND_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse body AFTER basic auth presence check
    const { company_id, plan_type, customer_email } = await req.json();

    if (!company_id || !plan_type || !customer_email) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate required secrets early
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const frontendUrl = Deno.env.get('FRONTEND_URL');

    if (!stripeSecret || !supabaseUrl || !supabaseServiceRoleKey || !frontendUrl) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // User-scoped client for authorization checks
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Authorize company: ensure caller is a member of the provided company_id
    const { data: isMember, error: memberErr } = await supabaseUser.rpc('is_company_member', { p_company_id: company_id });
    if (memberErr || !isMember) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeSecret as string, {
      apiVersion: '2024-06-20',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Admin client for backend operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Check if Stripe Customer exists for the company
    let stripeCustomerId: string | null = null;
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('stripe_customer_id')
      .eq('id', company_id)
      .single();

    if (companyError && companyError.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: 'Failed to fetch company data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (companyData?.stripe_customer_id) {
      stripeCustomerId = companyData.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        metadata: { supabase_company_id: company_id },
      });
      stripeCustomerId = customer.id;

      const { error: updateCompanyError } = await supabaseAdmin
        .from('companies')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', company_id);

      if (updateCompanyError) {
        return new Response(JSON.stringify({ error: 'Failed to update company' }), {
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
        return new Response(JSON.stringify({ error: 'Contact sales for the Enterprise plan.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      default:
        return new Response(JSON.stringify({ error: 'Invalid plan_type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!priceId) {
      return new Response(JSON.stringify({ error: 'Price not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId!,
      mode: 'subscription',
      line_items: [{ price: priceId!, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard?success=true`,
      cancel_url: `${frontendUrl}/plans?cancelled=true`,
      metadata: { company_id, plan_type },
      subscription_data: { trial_from_plan: true },
    });

    return new Response(JSON.stringify({ url: checkoutSession.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (_error) {
    // Return generic error to avoid leaking internals
    return new Response(JSON.stringify({ error: 'Failed to create checkout session' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});