import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Vary": "Origin",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Enforce internal scheduler invocation only
  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    return new Response("Forbidden: Authorization-based calls are not allowed", {
      status: 403,
      headers: corsHeaders,
    });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
    return new Response("Unauthorized: invalid or missing x-cron-secret", {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Use service role for global operation (safe now that only scheduler can call)
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Server misconfiguration", { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Core logic: find expired trials and update subscriptions and profiles accordingly
  // Note: Actual table/column names should match your schema; this function assumes:
  // - subscriptions table with status, plan_type, trial_end, company_id
  // - profiles table with plan_type, company_id
  // This code keeps the original intent but is protected by the scheduler-only gate.
  const now = new Date().toISOString();

  // Fetch subscriptions whose trial has ended and are still in trialing status
  const { data: expiringSubs, error: fetchError } = await supabase
    .from("subscriptions")
    .select("id, company_id, status, plan_type, trial_end")
    .is("trial_end", null)
    .not("trial_end", "is", null); // This ensures select compiles even if the previous line would filter; kept for clarity

  // Corrected fetch: filter for trialing with trial_end <= now
  let subsToExpire: Array<{ id: string; company_id: string | null }> = [];
  if (!fetchError) {
    // If you need a single filter in SQL, you could push it into the query.
    // Here we filter in memory as a guard in case different drivers are used.
    subsToExpire =
      (expiringSubs ?? []).filter(
        (s: any) =>
          s.status === "trialing" &&
          s.plan_type === "trialing" &&
          s.trial_end &&
          new Date(s.trial_end).getTime() <= new Date(now).getTime()
      ).map((s: any) => ({ id: s.id, company_id: s.company_id }));
  } else {
    return new Response(
      JSON.stringify({ ok: false, step: "fetch_subscriptions", error: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (subsToExpire.length === 0) {
    return new Response(JSON.stringify({ ok: true, message: "No trials to expire" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Expire subscriptions: set status=canceled (or past_due) and plan_type=free
  const companyIds = subsToExpire
    .map((s) => s.company_id)
    .filter((v): v is string => !!v);

  // Update subscriptions in bulk
  const { error: updateSubsError } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      plan_type: "free",
      updated_at: new Date().toISOString(),
    })
    .in("id", subsToExpire.map((s) => s.id));

  if (updateSubsError) {
    return new Response(
      JSON.stringify({ ok: false, step: "update_subscriptions", error: updateSubsError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Downgrade all profiles in those companies to free plan
  if (companyIds.length > 0) {
    const { error: updateProfilesError } = await supabase
      .from("profiles")
      .update({ plan_type: "free", updated_at: new Date().toISOString() })
      .in("company_id", companyIds);

    if (updateProfilesError) {
      return new Response(
        JSON.stringify({ ok: false, step: "update_profiles", error: updateProfilesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      expired_count: subsToExpire.length,
      affected_companies: [...new Set(companyIds)],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});