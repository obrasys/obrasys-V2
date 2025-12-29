"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Subscription } from "@/schemas/subscription-schema";
import { Badge } from "@/components/ui/badge";

const TrialBanner: React.FC = () => {
  const { companyId, isLoading: isSessionLoading } = useSession();
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = React.useState(true);

  const DEFAULT_TRIAL_DAYS = 14;

  React.useEffect(() => {
    const fetchSubscription = async () => {
      if (!companyId) {
        setSubscription(null);
        setIsLoadingSubscription(false);
        return;
      }

      // Seleciona a subscrição mais recente da empresa
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        console.error("Erro ao carregar subscrição:", subError);
        toast.error(`Erro ao carregar dados da subscrição: ${subError.message}`);
        setSubscription(null);
      } else if (subData) {
        setSubscription(subData as Subscription);
      } else {
        setSubscription(null);
      }
      setIsLoadingSubscription(false);
    };

    if (!isSessionLoading) {
      fetchSubscription();
    }
  }, [companyId, isSessionLoading]);

  // Mostrar apenas quando há subscrição conhecida
  if (isLoadingSubscription || !subscription) {
    return null;
  }

  const now = new Date();

  const trialEndDate = subscription.trial_end
    ? parseISO(subscription.trial_end)
    : (subscription.trial_start ? (() => {
        const start = parseISO(subscription.trial_start);
        const end = new Date(start);
        end.setDate(end.getDate() + DEFAULT_TRIAL_DAYS);
        return end;
      })() : null);

  const rawTrialDaysRemaining = trialEndDate ? differenceInDays(trialEndDate, now) : 0;
  const trialDaysRemaining = Math.max(0, rawTrialDaysRemaining);

  const renewalDate = subscription.current_period_end ? parseISO(subscription.current_period_end) : null;
  const rawRenewDays = renewalDate ? differenceInDays(renewalDate, now) : null;
  const renewDays = rawRenewDays !== null ? Math.max(0, rawRenewDays) : null;

  const prettyPlan = (subscription.plan_type || 'trialing').replace('_', ' ');

  let bannerContent = "";
  let subText = "";
  let icon: React.ReactNode = null;
  let bgColorClass = "";
  let textColorClass = "";
  let buttonText = "Ver Planos";
  let buttonVariant: "default" | "outline" | "destructive" = "default";
  let buttonLink = "/plans";
  let badgeText: string | null = null;
  let badgeClass = "bg-blue-600 text-white";

  if (subscription.status === "active") {
    icon = <CheckCircle className="h-5 w-5" />;
    bgColorClass = "bg-emerald-50 dark:bg-emerald-950";
    textColorClass = "text-emerald-800 dark:text-emerald-200";
    bannerContent = `Plano ${prettyPlan} ativo.`;
    if (renewDays !== null && renewalDate) {
      subText = `Renova em ${renewDays} dia(s) • ${format(renewalDate, "dd/MM/yyyy")}`;
      badgeText = `${renewDays}d`;
      badgeClass = "bg-emerald-600 text-white";
    } else {
      subText = "Renovação automática ativa.";
    }
    buttonText = "Gerir Assinatura";
    buttonVariant = "outline";
    buttonLink = "/profile?tab=company";
  } else if (subscription.status === "trialing") {
    if (trialDaysRemaining > 0) {
      icon = <Clock className="h-5 w-5" />;
      bgColorClass = "bg-blue-50 dark:bg-blue-950";
      textColorClass = "text-blue-800 dark:text-blue-200";
      bannerContent = `Trial gratuito`;
      subText = `Faltam ${trialDaysRemaining} dia(s) • ${trialEndDate ? format(trialEndDate, "dd/MM/yyyy") : ""}`;
      buttonText = "Ativar Plano";
      badgeText = `${trialDaysRemaining}d`;
      badgeClass = "bg-blue-600 text-white";
    } else {
      icon = <XCircle className="h-5 w-5" />;
      bgColorClass = "bg-red-50 dark:bg-red-950";
      textColorClass = "text-red-800 dark:text-red-200";
      bannerContent = "O seu trial gratuito terminou.";
      buttonText = "Ativar Assinatura";
      buttonVariant = "destructive";
      badgeText = null;
    }
  } else if (subscription.status === "expired") {
    icon = <XCircle className="h-5 w-5" />;
    bgColorClass = "bg-red-50 dark:bg-red-950";
    textColorClass = "text-red-800 dark:text-red-200";
    bannerContent = "A sua assinatura expirou.";
    subText = "Ative para continuar a usar o Obra Sys.";
    buttonText = "Reativar Assinatura";
    buttonVariant = "destructive";
    badgeText = null;
  } else if (subscription.status === "suspended" || subscription.status === "cancelled") {
    icon = <Info className="h-5 w-5" />;
    bgColorClass = "bg-yellow-50 dark:bg-yellow-950";
    textColorClass = "text-yellow-800 dark:text-yellow-200";
    bannerContent = `A sua assinatura está ${subscription.status === "suspended" ? "suspensa" : "cancelada"}.`;
    subText = "Verifique dados de pagamento ou contacte suporte.";
    buttonText = "Gerir Assinatura";
    buttonVariant = "outline";
    buttonLink = "/profile?tab=company";
    badgeText = null;
  } else {
    return null;
  }

  return (
    <Card className={cn("p-4 flex items-center justify-between gap-4", bgColorClass, textColorClass)}>
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex flex-col">
          <p className="font-medium text-sm md:text-base">{bannerContent}</p>
          {subText && <p className="text-xs md:text-sm opacity-80">{subText}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badgeText && <Badge className={badgeClass}>{badgeText}</Badge>}
        <Button asChild variant={buttonVariant} className="flex-shrink-0">
          <Link to={buttonLink}>{buttonText}</Link>
        </Button>
      </div>
    </Card>
  );
};

export default TrialBanner;