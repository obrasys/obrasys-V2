import { supabase } from "@/integrations/supabase/client";

export async function getUserAccess() {
  const { data, error } = await supabase.rpc("get_user_access");

  if (error) {
    throw error;
  }

  return data as {
    plan: string;
    trialEndsAt?: string;
    features: Record<string, boolean>;
  };
}
