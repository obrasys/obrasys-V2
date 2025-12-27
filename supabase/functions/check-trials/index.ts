import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { isPast, formatISO } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should ideally be invoked by a Supabase scheduled job (cron job)
    // and thus doesn't need user authentication.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date();
    const todayISO = formatISO(today, { representation: 'date' });

    // Find subscriptions that are 'trialing' and whose 'trial_end' date is in the past
    const { data: expiredTrials, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, company_id, trial_end')
      .eq('status', 'trialing')
      .lte('trial_end', todayISO); // Check if trial_end is today or in the past

    if (fetchError) {
      console.error('Error fetching expired trials:', fetchError);
      throw new Error('Failed to fetch expired trials.');
    }

    if (expiredTrials && expiredTrials.length > 0) {
      console.log(`Found ${expiredTrials.length} expired trials.`);

      for (const trial of expiredTrials) {
        // Update subscription status to 'expired'
        const { error: updateSubError } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', trial.id);

        if (updateSubError) {
          console.error(`Error updating subscription ${trial.id} to expired:`, updateSubError);
          continue; // Continue to next trial even if one fails
        }

        // Update associated profile's plan_type to 'expired'
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ plan_type: 'expired', updated_at: new Date().toISOString() })
          .eq('company_id', trial.company_id);

        if (updateProfileError) {
          console.error(`Error updating profile for company ${trial.company_id} to expired plan_type:`, updateProfileError);
          continue;
        }

        console.log(`Subscription ${trial.id} for company ${trial.company_id} marked as expired.`);
        // TODO: Send email notification to the company admin about trial expiration
      }
    } else {
      console.log('No expired trials found today.');
    }

    return new Response(JSON.stringify({ message: 'Trial check completed.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-trials Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});