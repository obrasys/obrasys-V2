import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@16.2.0?target=deno";

/* =========================
   CORS
========================= */

const FRONTEND_ORIGINS = (Deno.env.get("FRONTEND_URL") ?? "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  return FRONTEND_ORIGINS.includes(origin);
}

function corsHeadersFor(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? (origin ?? "") : "",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

/* =========================
   HANDLER
========================= */

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return new Response(JSON.stringify({ error: "CORS not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "CORS not allowed" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    /* =========================
       AUTH
    ========================= */

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan_type } = await req.json();
    if (!plan_type) {
      return new Response(JSON.stringify({ error: "Missing plan_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* =========================
       ENV
    ========================= */

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const frontendUrl = Deno.env.get("FRONTEND_URL");

    if (!stripeSecret || !supabaseUrl || !serviceRoleKey || !frontendUrl) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* =========================
       SUPABASE (SERVICE ROLE)
    ========================= */

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    const userEmail = authData.user.email ?? undefined;

    /* =========================
       PROFILE → COMPANY
    ========================= */

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile?.company_id) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const companyId = profile.company_id;

    const { data: isMember } = await supabase.rpc(
      "is_company_member",
      { p_company_id: companyId }
    );

    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* =========================
       STRIPE
    ========================= */

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-06-20",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let stripeCustomerId: string;

    const { data: company } = await supabase
      .from("companies")
      .select("stripe_customer_id, email")
      .eq("id", companyId)
      .single();

    if (company?.stripe_customer_id) {
      stripeCustomerId = company.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: company?.email || userEmail,
        metadata: { company_id: companyId },
      });

      stripeCustomerId = customer.id;

      await supabase
        .from("companies")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", companyId);
    }

    /* =========================
       PRICE
    ========================= */

    let priceId: string | undefined;

    if (plan_type === "iniciante") {
      priceId = Deno.env.get("STRIPE_PRICE_ID_INICIANTE");
    } else if (plan_type === "profissional") {
      priceId = Deno.env.get("STRIPE_PRICE_ID_PROFISSIONAL");
    } else {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Price not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /* =========================
       CHECKOUT
    ========================= */

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/dashboard?success=true`,
      cancel_url: `${frontendUrl}/plans?cancelled=true`,
      metadata: {
        company_id: companyId,
        user_id: userId,
        plan_type,
        origin: "create-checkout-session",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch {
    return new Response(JSON.stringify({ error: "Checkout failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
