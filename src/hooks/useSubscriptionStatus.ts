import { useEffect, useState } from 'react';
import { getCompanySubscriptionStatus } from '@/integrations/subscription/subscriptionService';
import { CompanySubscriptionStatus } from '@/schemas/subscription-schema';

export function useSubscriptionStatus(companyId?: string) {
  const [data, setData] = useState<CompanySubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    getCompanySubscriptionStatus(companyId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [companyId]);

  return { data, loading };
}
