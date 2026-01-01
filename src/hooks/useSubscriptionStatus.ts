import { useEffect, useRef, useState } from "react";
import { getCompanySubscriptionStatus } from "@/integrations/subscription/subscriptionService";

export function useSubscriptionStatus(companyId?: string | null) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!companyId) {
      setData(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    let mounted = true;

    setLoading(true);

    getCompanySubscriptionStatus(companyId)
      .then((result) => {
        // 🔒 só o último request pode escrever
        if (
          mounted &&
          requestId === requestIdRef.current
        ) {
          setData(result);
        }
      })
      .catch(() => {
        if (
          mounted &&
          requestId === requestIdRef.current
        ) {
          setData(null);
        }
      })
      .finally(() => {
        if (
          mounted &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [companyId]);

  return {
    data,
    loading,
    isActive:
      data?.status === "active" ||
      data?.status === "trialing",
    plan: data?.plan_key ?? "free",
  };
}
