import { useEffect, useState } from "react";
import { getCompanySubscriptionStatus } from "@/integrations/subscription/subscriptionService";

export function useSubscriptionStatus(companyId?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) {
      setLoading(false);
      return;
    }

    getCompanySubscriptionStatus(companyId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [companyId]);

  return {
    subscription: data,
    loading,
    isActive: data?.status === "active" || data?.status === "trialing",
    plan: data?.plan_key ?? "free",
  };
}
