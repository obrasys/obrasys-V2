import { supabase } from "@/integrations/supabase/client";

export type CompanySubscriptionStatus = {
  company_id: string;
  plan_key: "free" | "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getCompanySubscriptionStatus(companyId: string) {
  const { data, error } = await supabase
    .from("company_subscription_status")
    .select("*")
    .eq("company_id", companyId)
    .single();

  if (error) {
    console.error("Erro ao buscar status da assinatura:", error);
    throw error;
  }

  return data as CompanySubscriptionStatus;
}
