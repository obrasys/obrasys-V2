import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 🔒 Scheduler only
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || providedSecret !== cronSecret) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const now = new Date().toISOString();

  // ✅ Buscar APENAS trials vencidos
  const { data: expiredTrials, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("status", "trialing")
    .not("trial_end", "is", null)
    .lte("trial_end", now);

  if (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!expiredTrials || expiredTrials.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, message: "No expired trials" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // ✅ Marcar como expired (não canceled)
  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      status: "incomplete_expired",
      updated_at: new Date().toISOString(),
    })
    .in(
      "id",
      expiredTrials.map((s) => s.id)
    );

  if (updateError) {
    return new Response(
      JSON.stringify({ ok: false, error: updateError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      expired_count: expiredTrials.length,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
