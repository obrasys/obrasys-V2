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

const TrialBanner: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [subscription, setSubscription] = React.useState<Subscription | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = React.useState(true);

  React.useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        setSubscription(null);
        setIsLoadingSubscription(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData?.company_id) {
        console.error("Erro ao carregar company_id do perfil:", profileError);
        setSubscription(null);
        setIsLoadingSubscription(false);
        return;
      }

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', profileData.company_id)
        .single();

      if (subError && subError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Erro ao carregar subscrição:", subError);
        toast.error(`Erro ao carregar dados da subscrição: ${subError.message}`);
        setSubscription(null);
      } else if (subData) {
        setSubscription(subData);
      } else {
        setSubscription(null); // No subscription found
      }
      setIsLoadingSubscription(false);
    };

    if (!isSessionLoading) {
      fetchSubscription();
    }
  }, [user, isSessionLoading]);

  if (isLoadingSubscription || !subscription || subscription.status === "active") {
    return null; // Don't show banner if loading, no subscription, or active
  }

  const trialEndDate = subscription.trial_end ? parseISO(subscription.trial_end) : null;
  const daysRemaining = trialEndDate ? differenceInDays(trialEndDate, new Date()) : 0;

  let bannerContent;
  let icon;
  let bgColorClass;
  let textColorClass;
  let buttonText = "Ver Planos";
  let buttonVariant: "default" | "outline" | "destructive" = "default";
  let buttonLink = "/plans";

  if (subscription.status === "trialing") {
    if (daysRemaining > 0) {
      icon = <Clock className="h-5 w-5" />;
      bgColorClass = "bg-blue-50 dark:bg-blue-950";
      textColorClass = "text-blue-800 dark:text-blue-200";
      bannerContent = `Trial gratuito - Faltam ${daysRemaining} dia(s).`;
      buttonText = "Ativar Plano";
    } else {
      icon = <XCircle className="h-5 w-5" />;
      bgColorClass = "bg-red-50 dark:bg-red-950";
      textColorClass = "text-red-800 dark:text-red-200";
      bannerContent = "O seu trial gratuito terminou.";
      buttonText = "Ativar Assinatura";
      buttonVariant = "destructive";
    }
  } else if (subscription.status === "expired") {
    icon = <XCircle className="h-5 w-5" />;
    bgColorClass = "bg-red-50 dark:bg-red-950";
    textColorClass = "text-red-800 dark:text-red-200";
    bannerContent = "A sua assinatura expirou. Ative para continuar a usar o Obra Sys.";
    buttonText = "Reativar Assinatura";
    buttonVariant = "destructive";
  } else if (subscription.status === "suspended" || subscription.status === "cancelled") {
    icon = <Info className="h-5 w-5" />;
    bgColorClass = "bg-yellow-50 dark:bg-yellow-950";
    textColorClass = "text-yellow-800 dark:text-yellow-200";
    bannerContent = `A sua assinatura está ${subscription.status === "suspended" ? "suspensa" : "cancelada"}.`;
    buttonText = "Gerir Assinatura";
    buttonLink = "/profile?tab=company"; // Link to profile/company tab to manage subscription
  } else {
    return null; // Should not happen with defined statuses
  }

  return (
    <Card className={cn("p-4 flex items-center justify-between gap-4", bgColorClass, textColorClass)}>
      <div className="flex items-center gap-3">
        {icon}
        <p className="font-medium text-sm md:text-base">{bannerContent}</p>
      </div>
      <Button asChild variant={buttonVariant} className="flex-shrink-0">
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </Card>
  );
};

export default TrialBanner;