import { supabase } from '@/integrations/supabase/client';

/**
 * Tipagem oficial do estado da assinatura da empresa
 * Fonte única da verdade (Stripe + DB)
 */
export type CompanySubscriptionStatus = {
  company_id: string;

  /** Estado da subscrição conforme Stripe */
  status:
    | 'trial'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'inactive';

  /** Plano contratado */
  plan: 'free' | 'pro' | 'enterprise';

  /** Conveniência para regras de acesso */
  is_active: boolean;

  /** Stripe */
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;

  /** Datas */
  current_period_end?: string | null;

  /** Fiscalidade (alinhado com Stripe) */
  vat_rate?: number | null;           // ex: 23
  vat_amount?: number | null;         // ex: 11.27
  total_amount?: number | null;       // ex: 60.27
};

/**
 * Valor default quando a empresa ainda não tem subscrição
 * (onboarding seguro, sem crashes)
 */
const DEFAULT_SUBSCRIPTION: Omit<
  CompanySubscriptionStatus,
  'company_id'
> = {
  status: 'inactive',
  plan: 'free',
  is_active: false,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  current_period_end: null,
  vat_rate: null,
  vat_amount: null,
  total_amount: null,
};

/**
 * Fonte única da verdade sobre o estado da assinatura da empresa
 * Seguro para produção (não explode se não houver subscrição)
 */
export async function getCompanySubscriptionStatus(
  companyId: string
): Promise<CompanySubscriptionStatus> {
  const { data, error } = await supabase
    .from('company_subscription_status')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    console.error(
      '[Subscription] Erro ao buscar status da assinatura:',
      error
    );
    throw error;
  }

  if (!data) {
    return {
      company_id: companyId,
      ...DEFAULT_SUBSCRIPTION,
    };
  }

  return data as CompanySubscriptionStatus;
}

/**
 * Helper para regras de acesso
 * (UI, rotas protegidas, módulos pagos, etc.)
 */
export function hasActiveSubscription(
  subscription: CompanySubscriptionStatus | null | undefined
): boolean {
  return (
    !!subscription &&
    subscription.is_active === true &&
    subscription.status === 'active'
  );
}

/**
 * Helper para verificar se está em trial válido
 */
export function isInTrial(
  subscription: CompanySubscriptionStatus | null | undefined
): boolean {
  return (
    !!subscription &&
    subscription.status === 'trial' &&
    subscription.is_active === true
  );
}
