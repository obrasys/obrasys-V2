import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const FRONTEND_ORIGINS = (Deno.env.get('FRONTEND_URL') ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // allow server-to-server calls with no origin
  if (FRONTEND_ORIGINS.length === 0) return false; // fail closed if not configured
  return FRONTEND_ORIGINS.includes(origin);
}

function corsHeadersFor(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin ?? '') : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const ALLOWED_BUCKETS = new Set(['attachments', 'reports', 'avatars']);

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      return new Response(JSON.stringify({ error: 'CORS origin not allowed' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(null, { headers: corsHeaders });
  }

  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: 'CORS origin not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Enforce POST-only
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { bucket, path, company_id, expiresIn = 60 } = body || {};
    if (!bucket || !path || !company_id) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return new Response(JSON.stringify({ error: 'Bucket not allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clamp expiration to a safe range (10s–300s)
    const safeExpiresIn = Math.max(10, Math.min(300, Number(expiresIn) || 60));

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabaseUser = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify caller belongs to company
    const { data: isMember, error: memberErr } = await supabaseUser.rpc('is_company_member', { p_company_id: company_id });
    if (memberErr || !isMember) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current user for user-scoped validations (e.g., avatars)
    const { data: userRes } = await supabaseUser.auth.getUser();
    const userId = userRes?.user?.id || null;

    // Normalize path (strip leading slashes)
    const normalizedPath = String(path).replace(/^\/+/, '');

    // Enforce strict path ownership
    if (bucket === 'avatars') {
      if (!userId || !normalizedPath.startsWith(`${userId}/`)) {
        return new Response(JSON.stringify({ error: 'Invalid path for avatars bucket' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!normalizedPath.startsWith(`${company_id}/`)) {
        return new Response(JSON.stringify({ error: 'Path does not belong to company' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Basic audit logging
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    console.log(
      JSON.stringify({
        evt: 'generate-signed-url',
        userId,
        company_id,
        bucket,
        path: normalizedPath,
        expires: safeExpiresIn,
        ip
      })
    );

    const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(normalizedPath, safeExpiresIn);

    if (error || !data?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Failed to create signed URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});