import { supabase } from "@/integrations/supabase/client";

export type CompanySubscriptionStatus = {
  company_id: string;
  plan_key: "free" | "starter" | "pro";
  status: "trialing" | "active" | "past_due" | "canceled";
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export async function getCompanySubscriptionStatus(
  companyId: string
): Promise<CompanySubscriptionStatus | null> {
  const { data, error } = await supabase
    .from("company_subscription_status")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle(); // ✅ CRÍTICO

  // ⚠️ Nenhum registo = empresa sem subscrição ativa
  if (!data) {
    return {
      company_id: companyId,
      plan_key: "free",
      status: "trialing",
      current_period_end: null,
      cancel_at_period_end: false,
    };
  }

  if (error) {
    console.error(
      "Erro ao buscar status da assinatura:",
      error
    );
    throw error;
  }

  return data as CompanySubscriptionStatus;
}
