import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/* =========================
   CONFIG
========================= */

const ALLOWED_BUCKETS = new Set([
  "attachments",
  "reports",
  "avatars",
]);

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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
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

    const { bucket, path, expiresIn = 60 } = await req.json();

    if (!bucket || !path) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return new Response(JSON.stringify({ error: "Bucket not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeExpiresIn = Math.max(
      10,
      Math.min(300, Number(expiresIn) || 60),
    );

    /* =========================
       ENV
    ========================= */

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
       PATH VALIDATION
    ========================= */

    const normalizedPath = String(path).replace(/^\/+/, "");

    if (bucket === "avatars") {
      if (!normalizedPath.startsWith(`${userId}/`)) {
        return new Response(JSON.stringify({ error: "Invalid avatar path" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      if (!normalizedPath.startsWith(`${companyId}/`)) {
        return new Response(JSON.stringify({ error: "Invalid company path" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    /* =========================
       AUDIT LOG
    ========================= */

    console.log(JSON.stringify({
      evt: "generate-signed-url",
      user_id: userId,
      company_id: companyId,
      bucket,
      path: normalizedPath,
      expires: safeExpiresIn,
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
    }));

    /* =========================
       SIGNED URL
    ========================= */

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, safeExpiresIn);

    if (error || !data?.signedUrl) {
      return new Response(JSON.stringify({ error: "Failed to create signed URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
