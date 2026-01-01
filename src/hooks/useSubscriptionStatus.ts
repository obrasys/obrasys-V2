import { useEffect, useState } from "react";
import { getCompanySubscriptionStatus } from "@/integrations/subscription/subscriptionService";

export function useSubscriptionStatus(companyId?: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false); // ✅ começa false

  useEffect(() => {
    if (!companyId) {
      setData(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    getCompanySubscriptionStatus(companyId)
      .then((result) => {
        if (mounted) setData(result);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [companyId]);

  return {
    data, // ✅ CONTRATO CORRETO (MainLayout usa data)
    loading,
    isActive:
      data?.status === "active" || data?.status === "trialing",
    plan: data?.plan_key ?? "free",
  };
}
