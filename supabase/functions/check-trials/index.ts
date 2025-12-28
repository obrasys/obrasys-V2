import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { isPast, formatISO } from 'https://esm.sh/date-fns@3.6.0';

const FRONTEND_ORIGINS = (Deno.env.get('FRONTEND_URL') ?? '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // allow server-to-server/no-origin (cron)
  if (FRONTEND_ORIGINS.length === 0) return false;
  return FRONTEND_ORIGINS.includes(origin);
}

function corsHeadersFor(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? (origin ?? '') : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  };
}

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const cronSecret = Deno.env.get('CRON_SECRET');

    // Allow either:
    // - Internal CRON with x-cron-secret header matching CRON_SECRET
    // - An authenticated admin user
    const cronHeader = req.headers.get('x-cron-secret');
    const authHeader = req.headers.get('Authorization');

    let authorized = false;

    if (cronSecret && cronHeader && cronHeader === cronSecret) {
      authorized = true;
    } else if (authHeader) {
      const supabaseUser = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: isAdmin, error: adminErr } = await supabaseUser.rpc('is_admin');
      authorized = !!isAdmin && !adminErr;
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const today = new Date();
    const todayISO = formatISO(today, { representation: 'date' });

    const { data: expiredTrials, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, company_id, trial_end')
      .eq('status', 'trialing')
      .lte('trial_end', todayISO);

    if (fetchError) {
      throw new Error('Fetch expired trials failed');
    }

    if (expiredTrials && expiredTrials.length > 0) {
      for (const trial of expiredTrials) {
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', trial.id);

        await supabaseAdmin
          .from('profiles')
          .update({ plan_type: 'expired', updated_at: new Date().toISOString() })
          .eq('company_id', trial.company_id);
      }
    }

    return new Response(JSON.stringify({ message: 'Trial check completed.' }), {
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