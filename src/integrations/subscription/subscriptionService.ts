import { supabase } from '@/integrations/supabase/client';

/**
 * Fonte única da verdade sobre o estado da assinatura
 */
export async function getCompanySubscriptionStatus(companyId: string) {
  const { data, error } = await supabase
    .from('company_subscription_status')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Erro ao buscar status da assinatura:', error);
    throw error;
  }

  return data;
}
